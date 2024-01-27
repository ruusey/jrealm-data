package com.jrealm.data.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JrealmDataConfiguration {
	@Bean
	public ModelMapper modelMapper() {
		return new ModelMapper();
	}

}
