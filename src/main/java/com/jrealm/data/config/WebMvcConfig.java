package com.jrealm.data.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.jrealm.data.auth.PrivelegedAccessFilter;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

	@Autowired
	private PrivelegedAccessFilter accessFilter;
	
	public WebMvcConfig(@Autowired final PrivelegedAccessFilter accessFilter) {
		this.accessFilter = accessFilter;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(this.accessFilter).addPathPatterns("/data/**", "/admin/**");
	}
}