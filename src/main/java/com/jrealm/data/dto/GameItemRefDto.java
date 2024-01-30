package com.jrealm.data.dto;

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
public class GameItemRefDto extends TemporalDto {
	private static final long serialVersionUID = -5119762736198793613L;
	
	private Integer gameItemRefId;
	private Integer chestId;
	private Integer characterId;
	private Integer gameItemId;
	private String itemGuid;
}
