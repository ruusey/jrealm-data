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
@Table(name = "player_character_stats")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class CharacterStatsEntity extends TemporalEntity {
	private static final long serialVersionUID = 186218452080820122L;
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer characterStatsId;
	private Integer characterId;
	private Long xp;
	private Integer classId;
	private Integer hp;
	private Integer mp;
	private Integer def;
	private Integer att;
	private Integer spd;
	private Integer dex;
	private Integer vit;
	private Integer wis;
}
