package com.jrealm.data.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jrealm.data.dto.CharacterDto;
import com.jrealm.data.dto.PlayerAccountDto;
import com.jrealm.data.service.PlayerDataService;
import com.jrealm.data.util.ApiUtils;

@RestController
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

	@GetMapping(value = "/account/{accountUuid}/character", produces = { "application/json" })
	public ResponseEntity<?> getPlayerAccountCharacters(@PathVariable final String accountUuid) {
		ResponseEntity<?> res = null;
		try {
			res = ApiUtils.buildSuccess(this.playerDataService.getPlayerCharacters(accountUuid));
		} catch (Exception e) {
			res = ApiUtils.buildAndLogError("Failed to get player characters", e.getMessage());
		}
		return res;
	}

	@PostMapping(value = "/account/{accountUuid}/character", produces = { "application/json" })
	public ResponseEntity<?> createPlayerAccountCharacter(@PathVariable final String accountUuid,
			@RequestParam Integer classId) {
		ResponseEntity<?> res = null;
		try {
			res = ApiUtils.buildSuccess(this.playerDataService.createCharacter(accountUuid, classId));
		} catch (Exception e) {
			res = ApiUtils.buildAndLogError("Failed to create character", e.getMessage());
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

	@PostMapping(value = "/account/character/{characterUuid}", produces = { "application/json" })
	public ResponseEntity<?> saveCharacterStatsData(@PathVariable String characterUuid, @RequestBody final CharacterDto character) {
		ResponseEntity<?> res = null;
		try {
			res = ApiUtils.buildSuccess(this.playerDataService.saveCharacterStats(characterUuid, character));
		} catch (Exception e) {

			res = ApiUtils.buildAndLogError("Failed to save character stats", e.getMessage());
			e.printStackTrace();
		}
		return res;
	}
}
