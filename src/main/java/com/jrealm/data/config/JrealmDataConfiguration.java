package com.jrealm.data.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;

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
		final ConnectionString connectionString = new ConnectionString(
				"mongodb://localhost:27017/jrealm");

		final MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
				.applyConnectionString(connectionString).build();
		return MongoClients.create(mongoClientSettings);
	}
	
	@Bean
	public Docket swaggerDocs() {
		return new Docket(DocumentationType.SWAGGER_2)
				.select()
				.apis(RequestHandlerSelectors.any())
				.paths(PathSelectors.any())
				.build();
	}
}
