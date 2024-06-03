package com.jrealm.data.config;

import org.modelmapper.ModelMapper;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

import io.swagger.v3.oas.models.parameters.Parameter;

@Configuration
public class JrealmDataConfiguration extends AbstractMongoClientConfiguration {
	@Bean
	public ModelMapper modelMapper() {
		return new ModelMapper();
	}

	@Override
	protected String getDatabaseName() {
		return "jrealm";
	}

	@Override
	@Bean
	public MongoClient mongoClient() {
		//final ConnectionString connectionString = new ConnectionString("mongodb://host.docker.internal:27017/jrealm");
		final ConnectionString connectionString = new ConnectionString("mongodb://localhost:27017/jrealm");
		final MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
				.applyConnectionString(connectionString).build();
		return MongoClients.create(mongoClientSettings);
	}

	
	@Bean
	public OperationCustomizer customize() {
		return (operation, handlerMethod) -> {
			if(!handlerMethod.getMethod().getName().contains("login") && !handlerMethod.getMethod().getName().contains("ping")) {
				operation.addParametersItem(
				new Parameter()
                .in("header")
                .required(true)
                .description("JRealm Authorization Token")
                .name("Authorization"));
			}
			return operation;
		};
	}
}
