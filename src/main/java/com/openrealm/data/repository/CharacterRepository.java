package com.openrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.openrealm.data.entity.CharacterEntity;

public interface CharacterRepository extends MongoRepository<CharacterEntity, String> {
	public CharacterEntity findByCharacterUuid(String characterUuid);
	
}
