package com.jrealm.data.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

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
		final String host = System.getenv().getOrDefault("MONGO_HOST", "127.0.0.1");
		final ConnectionString connectionString = new ConnectionString("mongodb://" + host + ":27017/jrealm");
		final MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
				.applyConnectionString(connectionString).build();
		return MongoClients.create(mongoClientSettings);
	}

	
}
