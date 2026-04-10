package com.openrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.openrealm.data.entity.auth.AccountAccessEntity;

public interface AccountAccessRepository extends MongoRepository<AccountAccessEntity, String> {
	List<AccountAccessEntity> findAllByAccountGuid(String accountGuid);
}
