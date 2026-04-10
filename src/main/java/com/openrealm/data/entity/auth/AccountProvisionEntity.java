package com.openrealm.data.entity.auth;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import com.openrealm.data.dto.auth.AccountProvision;
import com.openrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document("account_provision")
@TypeAlias("com.jrealm.data.entity.auth.AccountProvisionEntity")
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class AccountProvisionEntity extends TemporalEntity {
	private static final long serialVersionUID = 3702040746346454205L;
	@Id
	private String accountProvisionId;
	private String identifier;
	private String accountId;
	private AccountProvision provision;
}
