package com.jrealm.data.controller;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jrealm.data.util.ApiUtils;
import com.jrealm.game.data.GameDataManager;

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
}
