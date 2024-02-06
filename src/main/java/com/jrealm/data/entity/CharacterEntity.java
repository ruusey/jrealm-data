package com.jrealm.data.entity;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("player_character")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class CharacterEntity extends TemporalEntity {
	private static final long serialVersionUID = -6906497561358089565L;
	@Id
	private String characterId;
	private String characterUuid;
	private Integer characterClass;
	private CharacterStatsEntity stats;
	@Builder.Default
	private List<GameItemRefEntity> items = new ArrayList<>();

	public void addItem(final GameItemRefEntity item) {
		this.items.add(item);
	}

	public boolean removeItem(final GameItemRefEntity item) {
		return this.items.remove(item);
	}

	public void setStats(final CharacterStatsEntity stats) {
		this.stats = stats;
	}

	public void removeItems() {
		this.items.clear();
	}
}
