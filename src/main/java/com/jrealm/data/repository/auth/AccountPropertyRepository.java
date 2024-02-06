package com.jrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jrealm.data.entity.auth.AccountPropertyEntity;

public interface AccountPropertyRepository extends MongoRepository<AccountPropertyEntity, String> {
	List<AccountPropertyEntity> findAllByAccountId(String accountId);

	AccountPropertyEntity findByAccountIdAndKey(String accountId, String key);

	//	@Transactional
	//	@Modifying
	//	@Query("UPDATE AccountPropertyEntity AS ap SET ap.value = ?3, ap.expires = ?4 WHERE ap.accountId = ?1 AND ap.key = ?2")
	//	void updateAccountProperty(Integer accountId, String key, String value, Timestamp expires);
}
