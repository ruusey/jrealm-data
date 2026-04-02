package com.jrealm.data.controller;

import java.io.File;
import java.io.FileWriter;
import java.net.URL;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jrealm.data.dto.auth.AccountProvision;
import com.jrealm.data.util.AdminRestricted;
import com.jrealm.data.util.ApiUtils;
import com.jrealm.game.data.GameDataManager;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/gamedata")
public class GameDataController {
	 @GetMapping(value = "/item/{itemId}", produces = { "application/json" })
	    public ResponseEntity<?> getGameItemByItemId(final HttpServletRequest request, @PathVariable final Integer itemId) {
	        ResponseEntity<?> res = null;
	        try {
	            res = ApiUtils.buildSuccess(GameDataManager.GAME_ITEMS.get(itemId));
	        } catch (Exception e) {
	            e.printStackTrace();
	            res = ApiUtils.buildAndLogError("Failed to get top characters", e.getMessage());
	        }
	        return res;
	    }

	 @GetMapping(value = "/item", produces = { "application/json" })
	    public ResponseEntity<?> getTopCharacters(final HttpServletRequest request) {
	        ResponseEntity<?> res = null;
	        try {
	            res = ApiUtils.buildSuccess(GameDataManager.GAME_ITEMS);
	        } catch (Exception e) {
	            e.printStackTrace();
	            res = ApiUtils.buildAndLogError("Failed to get top characters", e.getMessage());
	        }
	        return res;
	    }

	 @PutMapping(value = "/tiles", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveTiles(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("tiles.json", json);
	 }

	 @PutMapping(value = "/terrains", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveTerrains(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("terrains.json", json);
	 }

	 @PutMapping(value = "/items", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveItems(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("game-items.json", json);
	 }

	 @PutMapping(value = "/projectiles", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveProjectiles(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("projectile-groups.json", json);
	 }

	 @PutMapping(value = "/enemies", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveEnemies(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("enemies.json", json);
	 }

	 @PutMapping(value = "/maps", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveMaps(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("maps.json", json);
	 }

	 @PutMapping(value = "/lootgroups", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveLootGroups(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("loot-groups.json", json);
	 }

	 @PutMapping(value = "/loottables", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveLootTables(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("loot-tables.json", json);
	 }

	 @PutMapping(value = "/animations", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> saveAnimations(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("animations.json", json);
	 }

	 @PutMapping(value = "/portals", consumes = { "application/json" }, produces = { "application/json" })
	 @AdminRestricted(provisions = { AccountProvision.OPENREALM_EDITOR })
	 public ResponseEntity<?> savePortals(final HttpServletRequest request, @RequestBody final String json) {
	     return saveDataFile("portals.json", json);
	 }

	 private ResponseEntity<?> saveDataFile(String filename, String json) {
	     try {
	         URL resource = getClass().getClassLoader().getResource("data/" + filename);
	         if (resource == null) {
	             return ApiUtils.buildAndLogError("Failed to save " + filename, filename + " resource not found");
	         }
	         File compiledFile = new File(resource.toURI());
	         try (FileWriter writer = new FileWriter(compiledFile)) {
	             writer.write(json);
	         }
	         log.info("Saved {} to target ({} bytes): {}", filename, json.length(), compiledFile.getAbsolutePath());

	         File projectRoot = compiledFile.getParentFile();
	         while (projectRoot != null && !new File(projectRoot, "src").isDirectory()) {
	             projectRoot = projectRoot.getParentFile();
	         }
	         if (projectRoot != null) {
	             File sourceFile = new File(projectRoot, "src/main/resources/data/" + filename);
	             if (sourceFile.exists()) {
	                 try (FileWriter srcWriter = new FileWriter(sourceFile)) {
	                     srcWriter.write(json);
	                 }
	                 log.info("Saved {} to source: {}", filename, sourceFile.getAbsolutePath());
	             } else {
	                 log.warn("Source file not found at: {}", sourceFile.getAbsolutePath());
	             }
	         } else {
	             log.warn("Could not locate project root from: {}", compiledFile.getAbsolutePath());
	         }

	         return ApiUtils.buildSuccess("OK");
	     } catch (Exception e) {
	         e.printStackTrace();
	         return ApiUtils.buildAndLogError("Failed to save " + filename, e.getMessage());
	     }
	 }
}
