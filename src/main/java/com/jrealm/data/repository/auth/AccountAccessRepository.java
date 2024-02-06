package com.jrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.auth.AccountAccessEntity;

public interface AccountAccessRepository extends MongoRepository<AccountAccessEntity, String> {
	List<AccountAccessEntity> findAllByAccountGuid(String accountGuid);
}
