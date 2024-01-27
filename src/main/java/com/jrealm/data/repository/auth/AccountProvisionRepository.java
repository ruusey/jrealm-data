package com.jrealm.data.repository.auth;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.jrealm.data.entity.auth.AccountProvisionEntity;


public interface AccountProvisionRepository extends CrudRepository<AccountProvisionEntity, Integer> {
	@Query("SELECT NEW com.jrealm.data.entity.auth.AccountProvisionEntity(ap.accountProvisionId, ap.identifier, ap.accountId, ap.provision) FROM AccountProvisionEntity AS ap WHERE ap.accountId = ?1")
	List<AccountProvisionEntity> getAccountProvisions(Integer accountId);
}
