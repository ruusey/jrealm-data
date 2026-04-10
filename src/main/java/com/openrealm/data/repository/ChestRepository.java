package com.openrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.openrealm.data.entity.ChestEntity;

public interface ChestRepository extends MongoRepository<ChestEntity, String> {
	public ChestEntity findByChestUuid(String chestUuid);
}
