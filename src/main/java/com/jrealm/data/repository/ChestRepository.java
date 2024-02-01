package com.jrealm.data.repository;

import org.springframework.data.repository.CrudRepository;

import com.jrealm.data.entity.ChestEntity;

public interface ChestRepository extends CrudRepository<ChestEntity, Integer>{
	public ChestEntity findByChestUuid(String chestUuid);
}
