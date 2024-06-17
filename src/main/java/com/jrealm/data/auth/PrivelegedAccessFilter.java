package com.jrealm.data.auth;

import javax.annotation.Priority;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import com.jrealm.data.dto.auth.AccountDto;
import com.jrealm.data.entity.auth.AccountAuthEntity;
import com.jrealm.data.entity.auth.AccountTokenEntity;
import com.jrealm.data.repository.auth.AccountAuthRepository;
import com.jrealm.data.repository.auth.AccountTokenRepository;
import com.jrealm.data.service.AccountService;
import com.jrealm.data.util.AdminRestricted;

import lombok.extern.slf4j.Slf4j;

@Component
@Order(Integer.MIN_VALUE + 1)
@Priority(2)
@Slf4j
public class PrivelegedAccessFilter implements HandlerInterceptor {
    private final transient AccountService accountService;
    private AccountAuthRepository accountAuthRepo;
    private AccountTokenRepository accountTokenRepo;
    
    public PrivelegedAccessFilter(@Autowired final AccountService accountService,@Autowired final AccountAuthRepository accountAuthRepo,
            @Autowired final AccountTokenRepository accountTokenRepo) {
        this.accountService = accountService;
        this.accountAuthRepo = accountAuthRepo;
        this.accountTokenRepo = accountTokenRepo;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        
        if (request.getRemoteAddr().equals("127.0.0.1") || request.getRemoteAddr().equals("0:0:0:0:0:0:0:1")
                || request.getServletPath().equals("/admin/account/login")
                || request.getServletPath().equals("/admin/account/register")
                || request.getServletPath().equals("/v3/api-docs") || request.getServletPath().equals("/ping")
                || request.getServletPath().contains("/swagger-ui")
                || request.getServletPath().contains("/swagger-resources")
                || request.getServletPath().contains("/swagger-config")
                || request.getServletPath().matches("/.*[a-z0-9 -].png")
                || request.getServletPath().matches("/.*[a-z0-9 -].json")
                || request.getServletPath().matches("/game-data/[^/]+")) {
            log.debug("Safe path detected {}", request.getServletPath());
            return true;
        }
        String authToken = null;
        AccountAuthEntity authedUser = null;
        AccountTokenEntity systemToken = null;
        try {
            if (request.getHeader("Authorization").contains("Bearer")) {
                authToken = this.extractBearerToken(request);
                systemToken = this.accountTokenRepo.findByToken(authToken);
            } else {
                authToken = this.extractAuthToken(request);
                authedUser = this.accountAuthRepo.findBySessionToken(authToken);
            }
        } catch (Exception e) {
            log.error(e.getMessage());
            response.sendError(401, e.getMessage());
            return false;
        }
        if (authedUser != null && !authedUser.isExpiredOrEmpty()) {
            response.setHeader("Account-Uuid", authedUser.getAccountGuid());
            // response.setHeader("Authorization", authedUser.getSessionToken());
            return true;
        } else if (systemToken != null) {
            response.setHeader("Account-Uuid", authedUser.getAccountGuid());
            // response.setHeader("Authorization", systemToken.getToken());
            return true;
        } else {
            response.sendError(401, "Authorization is invalid.");
        }
        
        
        final HandlerMethod handlerMethod = (HandlerMethod) handler;
        final java.lang.reflect.Method method = handlerMethod.getMethod();
        if (method.getDeclaredAnnotation(AdminRestricted.class) != null) {
            final String authedUuid = response.getHeader("Account-Uuid");
            log.info("User {} accessing Admin-Restricted endpoint...");
            AccountDto account = this.accountService.getAccountByGuid(authedUuid);
            if (account.isAdmin()) {
                return true;
            }
            response.setStatus(401);
            return false;
        } else {
            return true;
        }
    }
    
    private String extractAuthToken(HttpServletRequest request) throws ServletException {
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || authHeader.isEmpty()) {
            log.info(request.getServletPath());
            throw new ServletException("Authorization is required to access this resource.");
        }
        return authHeader;
    }

    private String extractBearerToken(HttpServletRequest request) throws ServletException {
        final String authHeader = request.getHeader("Authorization").split(" ")[1];

        if (authHeader == null || authHeader.isEmpty()) {
            log.info(request.getServletPath());
            throw new ServletException("Authorization is required to access this resource.");
        }
        return authHeader;
    }
}
