package com.jrealm.data.entity;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import com.jrealm.data.service.PlayerDataService;

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
	private Integer itemId;
	private Integer slotIdx;
	private String itemUuid;
	
	@ManyToOne
	private ChestEntity ownerChest;
	
	@ManyToOne
	private CharacterEntity ownerCharacter;

	@Override
	public int hashCode() {
		return Objects.hash(this.gameItemRefId, this.itemId, this.itemUuid, this.slotIdx);
	}
	
	@Override
	public boolean equals(Object other) {
		GameItemRefEntity cast = (GameItemRefEntity) other;
		if((cast==null) || (this.getItemUuid()==null) || (cast.getItemUuid()==null)) {
			System.out.println();
		}
		return (this.gameItemRefId == cast.getGameItemRefId()) && (this.itemId==cast.getItemId()) && this.itemUuid.equals(cast.getItemUuid()) && (this.slotIdx == cast.getSlotIdx());
	}
	
	@Override
	public String toString() {
		return this.gameItemRefId+", "+this.itemId+", "+this.itemUuid;
	}
	
	public static GameItemRefEntity from(final int targetIndex, final int itemId) {
		return GameItemRefEntity.builder().itemUuid(PlayerDataService.randomUuid()).slotIdx(targetIndex).itemId(itemId).build();
	}
	
	public static Set<GameItemRefEntity> SET_OF_NULL_ITEM(final int size){
		final Set<GameItemRefEntity> items = new HashSet<>();
		for(int i = 0; i<size; i++) {
			items.add(GameItemRefEntity.EMPTY());
		}
		return items;
	}
	
	public static GameItemRefEntity EMPTY() {
		 return GameItemRefEntity.builder().itemId(-1).itemUuid(PlayerDataService.randomUuid()).build();
	}
}
