package com.jrealm.data.entity;

import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "player_character")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class CharacterEntity extends TemporalEntity {
	private static final long serialVersionUID = -6906497561358089565L;
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer characterId;
	private Integer accountId;
	private Integer characterGuid;
	private Integer characterClass;
	
	@OneToOne(cascade = { CascadeType.ALL }, fetch = FetchType.EAGER, targetEntity = CharacterStatsEntity.class)
	@JoinColumn(name = "characterId", referencedColumnName = "characterId", foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	private CharacterStatsEntity stats;
	
	@OneToOne(cascade = { CascadeType.ALL }, fetch = FetchType.EAGER, targetEntity = GameItemRefEntity.class)
	@JoinColumn(name = "characterId", referencedColumnName = "characterId", foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	private Set<GameItemRefEntity> items;
}
