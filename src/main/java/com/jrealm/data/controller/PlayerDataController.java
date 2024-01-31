package com.jrealm.data.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

	@GetMapping(value = "/account/{accountId}", produces = { "application/json" })
	public ResponseEntity<?> getTestResponse(@PathVariable final Integer accountId) {
		ResponseEntity<?> res = null;
		try {
			res = ApiUtils.buildSuccess(this.playerDataService.getAccountById(accountId));
		} catch (Exception e) {
			res = ApiUtils.buildAndLogError("Failed to find account", e.getMessage());
		}
		return res;
	}

}
