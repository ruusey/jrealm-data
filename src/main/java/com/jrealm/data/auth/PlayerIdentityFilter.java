package com.jrealm.data.auth;

import java.io.IOException;
import java.net.InetAddress;

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
import com.jrealm.data.repository.auth.AccountAuthRepository;

import lombok.extern.slf4j.Slf4j;

@Component
@Order(Integer.MIN_VALUE)
@Priority(1)
@Slf4j
public class PlayerIdentityFilter extends OncePerRequestFilter {
	private AccountAuthRepository accountAuthRepo;

	public PlayerIdentityFilter(@Autowired final AccountAuthRepository accountAuthRepo) {
		this.accountAuthRepo = accountAuthRepo;
	}

	@Override
	public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {	
		log.info("Request addr: {}", request.getRemoteAddr());
		log.info("My addr: {}", InetAddress.getLocalHost());
		if (request.getRemoteAddr().equals("127.0.0.1") 
				|| request.getRemoteAddr().equals("0:0:0:0:0:0:0:1")
				|| request.getServletPath().equals("/admin/account/login")
				|| request.getServletPath().equals("/v2/api-docs") || request.getServletPath().equals("/ping")
				|| request.getServletPath().contains("/swagger-ui")
				|| request.getServletPath().contains("/swagger-resources")
				|| request.getServletPath().matches("/.*[a-z0-9 -].png")
				|| request.getServletPath().matches("/.*[a-z0-9 -].json")) {
			log.debug("Safe path detected {}", request.getServletPath());
			filterChain.doFilter(request, response);
			return;
		}
		String authToken = null;
		try {
			authToken = this.extractAuthToken(request);
		} catch (Exception e) {
			log.error(e.getMessage());
			response.sendError(401, e.getMessage());
			return;
		}
		final AccountAuthEntity authedUser = this.accountAuthRepo.findBySessionToken(authToken);
		if (!authedUser.isExpiredOrEmpty()) {
			response.setHeader("Account-Uuid", authToken);
			response.setHeader("Authorization", authedUser.getSessionToken());
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
}
