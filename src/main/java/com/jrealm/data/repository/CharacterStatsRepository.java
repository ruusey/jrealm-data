package com.jrealm.data.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.jrealm.data.entity.CharacterStatsEntity;

public interface CharacterStatsRepository extends CrudRepository<CharacterStatsEntity, Integer>{
	public Optional<CharacterStatsEntity> findByCharacterId(final Integer characterId);
}
