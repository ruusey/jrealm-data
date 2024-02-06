package com.jrealm.data.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class CharacterDto extends TemporalDto{
	private static final long serialVersionUID = -8940547643757956271L;

	private String characterId;
	private String characterUuid;
	private Integer characterClass;
	private CharacterStatsDto stats;
	private List<GameItemRefDto> items;
}
