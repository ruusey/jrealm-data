package com.jrealm.data.repository.auth;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.auth.AccountEntity;

public interface AccountRepository extends MongoRepository<AccountEntity, String> {
	AccountEntity findByAccountGuid(String accountGuid);
	AccountEntity findByEmail(String email);
	AccountEntity findByExternalId(Integer externalId);
}
