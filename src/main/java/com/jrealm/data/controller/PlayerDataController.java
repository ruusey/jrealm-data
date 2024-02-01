package com.jrealm.data.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jrealm.data.dto.PlayerAccountDto;
import com.jrealm.data.entity.PlayerAccountEntity;
import com.jrealm.data.repository.PlayerAccountRepository;
import com.jrealm.data.service.PlayerDataService;
import com.jrealm.data.util.ApiUtils;

import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequestMapping("/data")
public class PlayerDataController {

	private final transient PlayerDataService playerDataService;

	public PlayerDataController(@Autowired PlayerDataService playerDataService) {
		this.playerDataService = playerDataService;
	}

	@GetMapping(value = "/account/{accountUuid}", produces = { "application/json" })
	public ResponseEntity<?> getPlayerAccount(@PathVariable final String accountUuid) {
		ResponseEntity<?> res = null;
		try {
			res = ApiUtils.buildSuccess(this.playerDataService.getAccountByUuid(accountUuid));
		} catch (Exception e) {
			res = ApiUtils.buildAndLogError("Failed to find account", e.getMessage());
		}
		return res;
	}
	
	@PostMapping(value = "/account", produces = { "application/json" })
	public ResponseEntity<?> saveAccountData(@RequestBody final PlayerAccountDto account) {
		ResponseEntity<?> res = null;
		try {
			res = ApiUtils.buildSuccess(this.playerDataService.saveAccount(account));
		} catch (Exception e) {
			res = ApiUtils.buildAndLogError("Failed to save account", e.getMessage());
		}
		return res;
	}
}
