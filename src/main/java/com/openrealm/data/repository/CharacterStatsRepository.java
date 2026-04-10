package com.openrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.openrealm.data.entity.CharacterStatsEntity;

public interface CharacterStatsRepository extends MongoRepository<CharacterStatsEntity, String> {
	//public Optional<CharacterStatsEntity> findByCharacterId(final Integer characterId);
}
