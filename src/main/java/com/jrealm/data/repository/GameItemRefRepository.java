package com.jrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.GameItemRefEntity;

public interface GameItemRefRepository extends MongoRepository<GameItemRefEntity, String> {
	public GameItemRefEntity findByItemUuid(String itemUuid);

}
