package com.openrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.openrealm.data.entity.GameItemRefEntity;

public interface GameItemRefRepository extends MongoRepository<GameItemRefEntity, String> {
	public GameItemRefEntity findByItemUuid(String itemUuid);

}
