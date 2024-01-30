package com.jrealm.data;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.jrealm.game.data.GameDataManager;

@SpringBootApplication
public class JrealmDataApplication {

	public static void main(String[] args) {
		GameDataManager.loadGameData();
		SpringApplication.run(JrealmDataApplication.class, args);
	}

}
