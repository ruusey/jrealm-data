package com.jrealm.data.auth;

import javax.annotation.Priority;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import com.jrealm.data.dto.auth.AccountDto;
import com.jrealm.data.service.AccountService;
import com.jrealm.data.util.AdminRestricted;

import lombok.extern.slf4j.Slf4j;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Priority(2)
@Slf4j
public class PrivelegedAccessFilter implements HandlerInterceptor {
    private final transient AccountService accountService;

    
    public PrivelegedAccessFilter(@Autowired final AccountService accountService) {
        this.accountService = accountService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        
        if (request.getRemoteAddr().equals("127.0.0.1") || request.getRemoteAddr().equals("0:0:0:0:0:0:0:1")
                || request.getServletPath().equals("/admin/account/login")
                || request.getServletPath().equals("/admin/account/register")
                || request.getServletPath().equals("/v3/api-docs") || request.getServletPath().equals("/ping")
                || request.getServletPath().contains("/index.html")
                || request.getServletPath().contains("/scripts.js")
                || request.getServletPath().contains("/style.css")
                || request.getServletPath().contains("/swagger-ui")
                || request.getServletPath().contains("/swagger-resources")
                || request.getServletPath().contains("/swagger-config")
                || request.getServletPath().matches("/.*[a-z0-9 -].png")
                || request.getServletPath().matches("/.*[a-z0-9 -].json")
                || request.getServletPath().matches("/game-data/[^/]+")) {
            log.debug("Safe path detected {}", request.getServletPath());
            return true;
        }
        
        final HandlerMethod handlerMethod = (HandlerMethod) handler;
        final java.lang.reflect.Method method = handlerMethod.getMethod();
        if (method.getDeclaredAnnotation(AdminRestricted.class) != null) {
            final String authedUuid = response.getHeader("Account-Uuid");
            log.info("User {} accessing Admin-Restricted endpoint...", authedUuid);
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
}
