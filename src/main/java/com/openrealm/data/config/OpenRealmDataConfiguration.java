package com.openrealm.data.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

@Configuration
public class OpenRealmDataConfiguration extends AbstractMongoClientConfiguration {
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
		final String mongoUri = System.getenv("MONGO_URI");
		final String connString;
		if (mongoUri != null && !mongoUri.isEmpty()) {
			connString = mongoUri;
		} else {
			final String host = System.getenv().getOrDefault("MONGO_HOST", "127.0.0.1");
			connString = "mongodb://" + host + ":27017/jrealm";
		}
		final ConnectionString connectionString = new ConnectionString(connString);
		final MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
				.applyConnectionString(connectionString).build();
		return MongoClients.create(mongoClientSettings);
	}

	
}
