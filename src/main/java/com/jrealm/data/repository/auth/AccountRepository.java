package com.jrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.jrealm.data.entity.auth.AccountEntity;

public interface AccountRepository extends CrudRepository<AccountEntity, Integer> {
	@Query("SELECT NEW com.jrealm.data.entity.auth.AccountEntity(acc.accountId, acc.externalId, acc.identifier, acc.accountGuid, acc.email, acc.accountName) FROM AccountEntity AS acc WHERE acc.accountGuid = ?1")
	AccountEntity findByGuid(String guid);

	@Query("SELECT NEW com.jrealm.data.entity.auth.AccountEntity(acc.accountId, acc.externalId, acc.identifier, acc.accountGuid, acc.email, acc.accountName) FROM AccountEntity AS acc WHERE acc.email = ?1")
	AccountEntity findByEmail(String email);

	@Query("SELECT NEW com.jrealm.data.entity.auth.AccountEntity(acc.accountId, acc.externalId, acc.identifier, acc.accountGuid, acc.email, acc.accountName) FROM AccountEntity AS acc WHERE acc.externalId = ?1")
	AccountEntity findByExternalId(Integer externalId);

	@Query("SELECT NEW com.jrealm.data.entity.auth.AccountEntity(acc.accountId, acc.externalId, acc.identifier, acc.accountGuid, acc.email, acc.accountName) FROM AccountEntity AS acc")
	List<AccountEntity> findAllFuzzy();

	List<AccountEntity> findAll(Pageable page);

	@Query(value = "SELECT COUNT(*) as newUserCount\r\n" + "FROM(\r\n"
			+ "	SELECT ACC.account_id, ACC.guid, ACC.created, ACC.deleted FROM clab.account AS ACC\r\n"
			+ "	WHERE ACC.created >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ?1 day)\r\n"
			+ ") AS NEW_USERS", nativeQuery = true)
	Integer newUserCount(Integer days);

}
