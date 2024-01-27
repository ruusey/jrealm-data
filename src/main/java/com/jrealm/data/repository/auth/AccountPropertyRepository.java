package com.jrealm.data.repository.auth;

import java.sql.Timestamp;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Transactional;

import com.jrealm.data.entity.auth.AccountPropertyEntity;

public interface AccountPropertyRepository extends CrudRepository<AccountPropertyEntity, Integer> {
	@Query("SELECT NEW com.jrealm.data.entity.auth.AccountPropertyEntity(ap.accountPropertyId, ap.identifier, ap.accountId,ap.key,ap.value,ap.expires) FROM AccountPropertyEntity AS ap WHERE ap.accountId = ?1")
	List<AccountPropertyEntity> getAccountProperties(Integer accountId);

	@Query("SELECT NEW com.jrealm.data.entity.auth.AccountPropertyEntity(ap.accountPropertyId, ap.identifier, ap.accountId, ap.key, ap.value, ap.expires) FROM AccountPropertyEntity AS ap WHERE ap.accountId = ?1 AND ap.key = ?2")
	AccountPropertyEntity getAccountPropertyByKey(Integer accountId, String key);

	@Transactional
	@Modifying
	@Query("UPDATE AccountPropertyEntity AS ap SET ap.value = ?3, ap.expires = ?4 WHERE ap.accountId = ?1 AND ap.key = ?2")
	void updateAccountProperty(Integer accountId, String key, String value, Timestamp expires);
}
