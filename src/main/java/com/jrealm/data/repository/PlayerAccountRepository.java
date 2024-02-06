package com.jrealm.data.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.jrealm.data.entity.PlayerAccountEntity;

public interface PlayerAccountRepository extends CrudRepository<PlayerAccountEntity, Integer> {
	public Optional<PlayerAccountEntity> findByAccountEmail(final String accountEmail);
	public Optional<PlayerAccountEntity> findByAccountUuid(final String accountUuid);

	public PlayerAccountEntity findByCharactersCharacterUuid(final String characterUuid);
}
