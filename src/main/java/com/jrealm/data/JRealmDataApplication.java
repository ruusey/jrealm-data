package com.jrealm.data;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.jrealm.game.data.GameDataManager;

@SpringBootApplication
public class JRealmDataApplication {

	public static void main(String[] args) {
		GameDataManager.loadGameData(false);
		SpringApplication.run(JRealmDataApplication.class, args);
	}

}
