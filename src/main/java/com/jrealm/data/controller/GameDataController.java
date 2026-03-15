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
	 public ResponseEntity<?> saveTiles(final HttpServletRequest request, @RequestBody final String tilesJson) {
	     try {
	         // Resolve the source file by walking up from the compiled classpath resource
	         // target/classes/data/tiles.json -> src/main/resources/data/tiles.json
	         URL resource = getClass().getClassLoader().getResource("data/tiles.json");
	         if (resource == null) {
	             return ApiUtils.buildAndLogError("Failed to save tiles", "tiles.json resource not found");
	         }
	         File compiledFile = new File(resource.toURI());
	         // Write to compiled output so it takes effect immediately
	         try (FileWriter writer = new FileWriter(compiledFile)) {
	             writer.write(tilesJson);
	         }
	         log.info("Saved tiles.json to target ({} bytes): {}", tilesJson.length(), compiledFile.getAbsolutePath());

	         // Also write to the source file so changes persist across rebuilds
	         // Walk up from target/classes/data/ to find src/main/resources/data/
	         File projectRoot = compiledFile.getParentFile();
	         while (projectRoot != null && !new File(projectRoot, "src").isDirectory()) {
	             projectRoot = projectRoot.getParentFile();
	         }
	         if (projectRoot != null) {
	             File sourceFile = new File(projectRoot, "src/main/resources/data/tiles.json");
	             if (sourceFile.exists()) {
	                 try (FileWriter srcWriter = new FileWriter(sourceFile)) {
	                     srcWriter.write(tilesJson);
	                 }
	                 log.info("Saved tiles.json to source: {}", sourceFile.getAbsolutePath());
	             } else {
	                 log.warn("Source file not found at: {}", sourceFile.getAbsolutePath());
	             }
	         } else {
	             log.warn("Could not locate project root from: {}", compiledFile.getAbsolutePath());
	         }

	         return ApiUtils.buildSuccess("OK");
	     } catch (Exception e) {
	         e.printStackTrace();
	         return ApiUtils.buildAndLogError("Failed to save tiles", e.getMessage());
	     }
	 }
}
