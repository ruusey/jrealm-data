package com.jrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.auth.AccountProvisionEntity;


public interface AccountProvisionRepository extends MongoRepository<AccountProvisionEntity, String> {
	List<AccountProvisionEntity> findAllByAccountId(String accountId);
}
