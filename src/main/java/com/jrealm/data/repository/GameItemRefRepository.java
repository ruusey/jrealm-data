package com.jrealm.data.repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Transactional;

import com.jrealm.data.entity.GameItemRefEntity;

public interface GameItemRefRepository extends CrudRepository<GameItemRefEntity, Integer> {
	public GameItemRefEntity findByItemUuid(String itemUuid);
	@Query("DELETE FROM com.jrealm.data.entity.GameItemRefEntity gi WHERE gi.itemUuid=?1")
	@Modifying
	@Transactional
	public void delete(String itemUuid);

	@Query("DELETE FROM com.jrealm.data.entity.GameItemRefEntity gi WHERE gi.gameItemRefId=?1")
	@Modifying
	@Transactional
	public void delete(Integer gameItemRefId);
}
