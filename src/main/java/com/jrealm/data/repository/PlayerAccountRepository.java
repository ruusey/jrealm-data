package com.jrealm.data.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.PlayerAccountEntity;

public interface PlayerAccountRepository extends MongoRepository<PlayerAccountEntity, String> {
	public PlayerAccountEntity findByAccountEmail(final String accountEmail);
	public PlayerAccountEntity findByAccountUuid(final String accountUuid);
	public PlayerAccountEntity findByCharactersCharacterUuid(final String characterUuid);
}
