package com.jrealm.data.entity.auth;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import com.jrealm.data.entity.TemporalEntity;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "account_token")
@Data
@Builder
@NoArgsConstructor
public class AccountTokenEntity extends TemporalEntity {

	private static final long serialVersionUID = -7299181282690860879L;

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer accountTokenId;

	@Column(unique = true)
	private String identifier;

	@Column(name = "accountGuid", length = 50)
	private String accountGuid;
	@Column(name = "tokenName", length = 50)
	private String tokenName;
	@Column(name = "token", length = 100)
	private String token;

	public AccountTokenEntity(Integer accountTokenId, String identifier, String accountGuid, String tokenName,
			String token) {
		this.accountTokenId = accountTokenId;
		this.identifier = identifier;
		this.accountGuid = accountGuid;
		this.tokenName = tokenName;
		this.token = token;
	}

}
