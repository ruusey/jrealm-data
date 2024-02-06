package com.jrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.ChestEntity;

public interface ChestRepository extends MongoRepository<ChestEntity, String> {
	public ChestEntity findByChestUuid(String chestUuid);
}
