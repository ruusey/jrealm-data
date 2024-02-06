package com.jrealm.data.entity.auth;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jrealm.data.dto.auth.AccountProvision;
import com.jrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("account_provision")
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class AccountProvisionEntity extends TemporalEntity {
	private static final long serialVersionUID = 3702040746346454205L;
	@Id
	private String accountProvisionId;
	private String identifier;
	private String accountId;
	private AccountProvision provision;
}
