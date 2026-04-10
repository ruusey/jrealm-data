package com.openrealm.data.entity.auth;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import com.openrealm.data.entity.TemporalEntity;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document("account_token")
@TypeAlias("com.jrealm.data.entity.auth.AccountTokenEntity")
@Data
@Builder
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class AccountTokenEntity extends TemporalEntity {

	private static final long serialVersionUID = -7299181282690860879L;

	@Id
	private String accountTokenId;
	private String identifier;
	private String accountGuid;
	private String tokenName;
	private String token;

	public AccountTokenEntity(String accountTokenId, String identifier, String accountGuid, String tokenName,
			String token) {
		this.accountTokenId = accountTokenId;
		this.identifier = identifier;
		this.accountGuid = accountGuid;
		this.tokenName = tokenName;
		this.token = token;
	}

}
