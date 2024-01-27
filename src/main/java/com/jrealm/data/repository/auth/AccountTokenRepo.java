package com.jrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.jrealm.data.entity.auth.AccountTokenEntity;

public interface AccountTokenRepo extends CrudRepository<AccountTokenEntity, Integer> {
	@Query("SELECT NEW com.jrealm.data.entity.auth.AccountTokenEntity(act.accountTokenId, act.identifier, act.accountGuid, act.tokenName, act.token) FROM AccountTokenEntity AS act WHERE act.token=?1")
	AccountTokenEntity findByToken(String token);

	List<AccountTokenEntity> findAllByAccountGuid(String accountGuid);
}
