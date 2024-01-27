package com.jrealm.data.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jrealm.data.entity.PlayerAccountEntity;
import com.jrealm.data.repository.PlayerAccountRepository;

import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
public class AccountController_ {

	private final transient PlayerAccountRepository playerAccounts;

	public AccountController_(@Autowired PlayerAccountRepository playerAccounts) {
		this.playerAccounts = playerAccounts;
	}

	@GetMapping(value = "/test", produces = { "application/json" })
	public ResponseEntity<?> getTestResponse() {
		try {
			PlayerAccountEntity account = PlayerAccountEntity.builder().accountEmail("ruusey@gmail.com").build();
			account = this.playerAccounts.save(account);
			return new ResponseEntity<PlayerAccountEntity>(account, HttpStatus.OK);
		} catch (Exception e) {

		}
		return null;
	}

}
