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
	public Integer gameItemRefId;
	private Integer chestId;
	private Integer characterId;
	private Integer gameItemId;
	private String itemGuid;

}
