package com.jrealm.data.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jrealm.data.dto.CharacterDto;
import com.jrealm.data.dto.ChestDto;
import com.jrealm.data.dto.PlayerAccountDto;
import com.jrealm.data.service.PlayerDataService;
import com.jrealm.data.util.ApiUtils;
import com.jrealm.data.util.ErrorResponseObject;

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

	@PostMapping(value = "/account/{accountUuid}/chest", produces = { "application/json" })
	public ResponseEntity<?> saveCharacterStatsData(@PathVariable String accountUuid,
			@RequestBody final List<ChestDto> chests) {
		ResponseEntity<?> res = null;
		try {
			res = ApiUtils.buildSuccess(this.playerDataService.saveChests(accountUuid, chests));
		} catch (Exception e) {

			res = ApiUtils.buildAndLogError("Failed to save account chests", e.getMessage());
			e.printStackTrace();
		}
		return res;
	}

	@PostMapping(value = "/account/{accountUuid}/chest/new", produces = { "application/json" })
	public ResponseEntity<?> saveCharacterStatsData(@PathVariable String accountUuid) {
		ResponseEntity<?> res = null;
		try {
			res = ApiUtils.buildSuccess(this.playerDataService.createChest(accountUuid));
		} catch (Exception e) {

			res = ApiUtils.buildAndLogError("Failed to create account chest", e.getMessage());
			e.printStackTrace();
		}
		return res;
	}

	@DeleteMapping(value = "/account/character/{characterUuid}", produces = { "application/json" })
	public ResponseEntity<?> deleteCharacter(@PathVariable String characterUuid) {
		ResponseEntity<?> res = null;
		try {
			this.playerDataService.deleteCharacter(characterUuid);
			
			res = ApiUtils.buildSuccess(ErrorResponseObject.builder().message("successfully deleted character "+characterUuid).reason("Character deleted").status(HttpStatus.OK).build());
		} catch (Exception e) {

			res = ApiUtils.buildAndLogError("Failed to save character stats", e.getMessage());
			e.printStackTrace();
		}
		return res;
	}
}
