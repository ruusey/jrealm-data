package com.openrealm.data.repository.auth;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.openrealm.data.entity.auth.AccountAuthEntity;

public interface AccountAuthRepository extends MongoRepository<AccountAuthEntity, String> {
	AccountAuthEntity findByAccountGuid(String guid);

	AccountAuthEntity findBySessionToken(String sessionToken);

}
