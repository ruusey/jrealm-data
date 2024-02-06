package com.jrealm.data.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jrealm.data.service.PlayerDataService;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("player_game_item")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class GameItemRefEntity extends TemporalEntity {
	private static final long serialVersionUID = -6575476631353169695L;
	@Id
	private String gameItemRefId;
	private Integer itemId;
	private Integer slotIdx;
	private String itemUuid;

	public static GameItemRefEntity from(final int targetIndex, final int itemId) {
		return GameItemRefEntity.builder().itemUuid(PlayerDataService.randomUuid()).slotIdx(targetIndex).itemId(itemId).build();
	}
}
