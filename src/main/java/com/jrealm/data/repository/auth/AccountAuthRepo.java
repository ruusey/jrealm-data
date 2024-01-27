package com.jrealm.data.repository.auth;

import org.springframework.data.repository.CrudRepository;

import com.jrealm.data.entity.auth.AccountAuthEntity;

public interface AccountAuthRepo extends CrudRepository<AccountAuthEntity, Integer> {
	AccountAuthEntity findByAccountGuid(String guid);

	AccountAuthEntity findBySessionToken(String sessionToken);

}
