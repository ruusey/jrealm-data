package com.jrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.auth.AccountTokenEntity;

public interface AccountTokenRepository extends MongoRepository<AccountTokenEntity, String> {
	AccountTokenEntity findByToken(String token);
	List<AccountTokenEntity> findAllByAccountGuid(String accountGuid);
	AccountTokenEntity findByTokenName(String tokenName);
}
