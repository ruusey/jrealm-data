package com.jrealm.data.entity;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player_game_item")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class GameItemRefEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer gameItemRefId;
	private Integer itemId;
	private String itemUuid;

	// Used to denote which character's inventory slot an item exists in
	// (only applies if characterId IS NOT NULL)
	// ex. 0 = Equip Slot 1, 4 = Inventory Slot 1.
	private Integer itemIndex;

	// The player account character this item exists on
	// if null then the item is in the vault.
	private Integer characterId;

}
