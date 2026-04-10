package com.openrealm.data.entity.auth;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.openrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document("account")
@TypeAlias("com.jrealm.data.entity.auth.AccountEntity")
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@EqualsAndHashCode(callSuper=false)
public class AccountEntity extends TemporalEntity {
	private static final long serialVersionUID = 1495349541894160647L;
	@Id
	private String accountId;
	private Integer externalId;
	private String identifier;
	private String accountGuid;
	private String email;
	private String accountName;
}
