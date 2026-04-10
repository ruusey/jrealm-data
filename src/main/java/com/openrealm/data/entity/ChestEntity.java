package com.openrealm.data.entity;

import java.util.HashSet;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document("player_chest")
@TypeAlias("com.jrealm.data.entity.ChestEntity")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
@EqualsAndHashCode(callSuper=false)
public class ChestEntity extends TemporalEntity{
	private static final long serialVersionUID = 7607170635634825869L;
	@Id
	private String chestId;
	private String chestUuid;
	private Integer ordinal;

	@Builder.Default
	private Set<GameItemRefEntity> items = new HashSet<>();

	public void addItem(final GameItemRefEntity item) {
		this.items.add(item);
	}

	public boolean removeItem(final GameItemRefEntity item) {
		return this.items.remove(item);
	}
}
