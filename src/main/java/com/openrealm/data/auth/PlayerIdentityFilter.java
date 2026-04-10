package com.openrealm.data.auth;

import java.io.IOException;

import javax.annotation.Priority;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.openrealm.data.dto.auth.AccountDto;
import com.openrealm.data.entity.auth.AccountAuthEntity;
import com.openrealm.data.entity.auth.AccountTokenEntity;
import com.openrealm.data.repository.auth.AccountAuthRepository;
import com.openrealm.data.repository.auth.AccountTokenRepository;
import com.openrealm.data.service.AccountService;
import com.openrealm.data.util.Util;

import lombok.extern.slf4j.Slf4j;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Priority(1)
@Slf4j
public class PlayerIdentityFilter extends OncePerRequestFilter {
    private AccountAuthRepository accountAuthRepo;
    private AccountTokenRepository accountTokenRepo;
    private AccountService accountService;

    public PlayerIdentityFilter(@Autowired final AccountAuthRepository accountAuthRepo,
            @Autowired final AccountTokenRepository accountTokenRepo,
            @Autowired final AccountService accountService) {
        this.accountAuthRepo = accountAuthRepo;
        this.accountTokenRepo = accountTokenRepo;
        this.accountService = accountService;
    }

    @Override
    public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
//		log.info("Request addr: {}", request.getRemoteAddr());
//		log.info("My addr: {}", InetAddress.getLocalHost());

        if (Util.isTrustedHost(request.getRemoteAddr())
                || request.getServletPath().equals("/admin/account/login")
                || request.getServletPath().equals("/admin/account/register")
                || request.getServletPath().equals("/ping")
                || request.getServletPath().contains("/index.html")
                || request.getServletPath().contains("/scripts.js")
                || request.getServletPath().contains("/style.css")
                || request.getServletPath().contains("favicon")
                || request.getServletPath().matches("/.*[a-z0-9 -].png")
                || request.getServletPath().matches("/.*[a-z0-9 -].json")
                || request.getServletPath().startsWith("/game-data/")
                || request.getServletPath().startsWith("/ws/")
                || request.getServletPath().equals("/")) {
            log.debug("Safe path detected {}", request.getServletPath());
            filterChain.doFilter(request, response);
            return;
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
            //log.error("Failed to extract auth data from {}s request. Reason: {}",request.getRemoteAddr(), e.getMessage());
            response.sendError(401, e.getMessage());
            return;
        }
        if (authedUser != null && !authedUser.isExpiredOrEmpty()) {
            response.setHeader("Account-Uuid", authedUser.getAccountGuid());
            // response.setHeader("Authorization", authedUser.getSessionToken());
            filterChain.doFilter(request, response);
        } else if (systemToken != null) {
            response.setHeader("Account-Uuid", authedUser.getAccountGuid());
            // response.setHeader("Authorization", systemToken.getToken());
            filterChain.doFilter(request, response);
        } else {
            response.sendError(401, "Authorization is invalid.");
        }
    }

    public String extractAuthToken(HttpServletRequest request) throws ServletException {
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || authHeader.isEmpty()) {
            log.info(request.getServletPath());
            throw new ServletException("Authorization is required to access this resource.");
        }
        return authHeader;
    }

    public String extractBearerToken(HttpServletRequest request) throws ServletException {
        final String authHeader = request.getHeader("Authorization").split(" ")[1];

        if (authHeader == null || authHeader.isEmpty()) {
            log.info(request.getServletPath());
            throw new ServletException("Authorization is required to access this resource.");
        }
        return authHeader;
    }
    
    public AccountDto getAuthedUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || authHeader.isEmpty()) return null;
        try {
            if (authHeader.contains("Bearer")) {
                String token = this.extractBearerToken(request);
                AccountTokenEntity systemToken = this.accountTokenRepo.findByToken(token);
                if (systemToken == null) return null;
                return this.accountService.getAccountByGuid(systemToken.getAccountGuid());
            } else {
                AccountAuthEntity authedUser = this.accountAuthRepo.findBySessionToken(authHeader);
                if (authedUser == null) return null;
                return this.accountService.getAccountByGuid(authedUser.getAccountGuid());
            }
        } catch (Exception e) {
            log.error("Failed to authenticate user. Reason: {}", e.getMessage());
        }
        return null;
    }
    
    public boolean accountGuidMatch(String providedGuid, HttpServletRequest actualRequest) {
       // Trusted hosts (localhost / game server) bypass account ownership checks
       if (Util.isTrustedHost(actualRequest.getRemoteAddr())) return true;
       final AccountDto actualAccount = this.getAuthedUser(actualRequest);
       if (actualAccount == null) return false;
       if (actualAccount.isAdmin()) return true;
       final AccountDto providedAccount = this.accountService.getAccountByGuid(providedGuid);
       if (providedAccount == null) return false;
       return actualAccount.getAccountGuid().equals(providedAccount.getAccountGuid());
    }
}
