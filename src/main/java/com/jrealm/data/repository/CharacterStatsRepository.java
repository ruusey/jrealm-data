package com.jrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.CharacterStatsEntity;

public interface CharacterStatsRepository extends MongoRepository<CharacterStatsEntity, String> {
	//public Optional<CharacterStatsEntity> findByCharacterId(final Integer characterId);
}
