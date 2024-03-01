package com.jrealm.data.auth;

import javax.annotation.Priority;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import com.jrealm.data.dto.auth.AccountDto;
import com.jrealm.data.service.AccountService;
import com.jrealm.data.util.AdminRestricted;

import lombok.extern.slf4j.Slf4j;

@Component
@Order(Integer.MIN_VALUE+1)
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
		final HandlerMethod handlerMethod = (HandlerMethod) handler;
		final java.lang.reflect.Method method = handlerMethod.getMethod();
		if (method.getDeclaredAnnotation(AdminRestricted.class) != null) {
			AccountDto account = this.accountService.getAccountByGuid(request.getHeader("Account-Uuid"));
			log.info("User {} accessing Admin-Restricted endpoint...");
			if(account.isAdmin()) {
				return true;
			}
			response.setStatus(401);
			return false;
		} else {
			return true;
		}
	}
}
