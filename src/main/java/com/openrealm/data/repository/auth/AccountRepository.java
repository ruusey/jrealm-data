package com.openrealm.data.repository.auth;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.openrealm.data.entity.auth.AccountEntity;

public interface AccountRepository extends MongoRepository<AccountEntity, String> {
	AccountEntity findByAccountGuid(String accountGuid);
	AccountEntity findByEmail(String email);
	AccountEntity findByExternalId(Integer externalId);
	AccountEntity findByAccountName(String accountName);
}
