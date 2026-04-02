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
public class LeaderboardEntryDto {
    private String accountName;
    private String characterUuid;
    private Integer characterClass;
    private String className;
    private Integer level;
    private Long fame;
    private List<GameItemRefDto> equipment;
    private CharacterStatsDto stats;
}
