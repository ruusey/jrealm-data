package com.jrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.CharacterEntity;

public interface CharacterRepository extends MongoRepository<CharacterEntity, String> {
	public CharacterEntity findByCharacterUuid(String characterUuid);
	
}
