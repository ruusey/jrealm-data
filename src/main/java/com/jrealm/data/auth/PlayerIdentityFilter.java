package com.jrealm.data.auth;

import java.io.IOException;

import javax.annotation.Priority;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.jrealm.data.entity.auth.AccountAuthEntity;
import com.jrealm.data.entity.auth.AccountTokenEntity;
import com.jrealm.data.repository.auth.AccountAuthRepository;
import com.jrealm.data.repository.auth.AccountTokenRepository;

import lombok.extern.slf4j.Slf4j;

@Component
@Order(Integer.MIN_VALUE)
@Priority(1)
@Slf4j
public class PlayerIdentityFilter extends OncePerRequestFilter {
	private AccountAuthRepository accountAuthRepo;
	private AccountTokenRepository accountTokenRepo;

	public PlayerIdentityFilter(@Autowired final AccountAuthRepository accountAuthRepo,
			@Autowired final AccountTokenRepository accountTokenRepo) {
		this.accountAuthRepo = accountAuthRepo;
		this.accountTokenRepo = accountTokenRepo;
	}

	@Override
	public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {	
//		log.info("Request addr: {}", request.getRemoteAddr());
//		log.info("My addr: {}", InetAddress.getLocalHost());
		
		if (request.getRemoteAddr().equals("127.0.0.1") 
				|| request.getRemoteAddr().equals("0:0:0:0:0:0:0:1")
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
			filterChain.doFilter(request, response);
			return;
		}
		String authToken = null;
		AccountAuthEntity authedUser = null;
		AccountTokenEntity systemToken = null;
		try {
			if(request.getHeader("Authorization").contains("Bearer")) {
				authToken = this.extractBearerToken(request);
				systemToken = this.accountTokenRepo.findByToken(authToken);
			}else {
				authToken = this.extractAuthToken(request);
				authedUser = this.accountAuthRepo.findBySessionToken(authToken);
			}
		} catch (Exception e) {
			log.error(e.getMessage());
			response.sendError(401, e.getMessage());
			return;
		}
		if (authedUser!=null && !authedUser.isExpiredOrEmpty()) {
			response.setHeader("Account-Uuid", authedUser.getAccountGuid());
			//response.setHeader("Authorization", authedUser.getSessionToken());
			filterChain.doFilter(request, response);
		}else if(systemToken!=null){
			response.setHeader("Account-Uuid", authedUser.getAccountGuid());
			//response.setHeader("Authorization", systemToken.getToken());
			filterChain.doFilter(request, response);
		} else {
			response.sendError(401, "Authorization is invalid.");
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
