package com.jrealm.data.entity;

import java.util.Objects;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
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
public class GameItemRefEntity extends TemporalEntity {
	private static final long serialVersionUID = -6575476631353169695L;
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer gameItemRefId;
	private Integer gameItemId;
	private String itemGuid;
	
	@ManyToOne
    @JoinColumn(name = "chest_id")
	private ChestEntity ownerChest;
	
	@ManyToOne
    @JoinColumn(name = "character_id")
	private CharacterEntity ownerCharacter;

	@Override
	public int hashCode() {
		return Objects.hash(gameItemRefId, gameItemId, itemGuid);
	}
	
	@Override
	public boolean equals(Object other) {
		GameItemRefEntity cast = (GameItemRefEntity) other;
		return (this.gameItemRefId == cast.getGameItemRefId()) && this.gameItemId==cast.getGameItemId() && this.itemGuid.equals(cast.getItemGuid());
	}

}
