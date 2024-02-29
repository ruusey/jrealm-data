package com.jrealm.data.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

import com.jrealm.data.service.PrivelegedAccessFilter;

@Configuration
public class WebMvcConfig extends WebMvcConfigurerAdapter {

  @Autowired 
  private PrivelegedAccessFilter yourInjectedInterceptor;

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
	  	registry.addInterceptor(yourInjectedInterceptor);
  }
}