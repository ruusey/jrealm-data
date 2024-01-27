package com.jrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.jrealm.data.entity.auth.AccountAccessEntity;

public interface AccountAccessRepository extends CrudRepository<AccountAccessEntity, Integer> {
	List<AccountAccessEntity> findAllByAccountGuid(String accountGuid);
}
