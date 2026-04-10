package com.openrealm.data.entity.auth;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import com.openrealm.data.dto.auth.AccountSubscription;
import com.openrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;


@Document("account_access")
@TypeAlias("com.jrealm.data.entity.auth.AccountAccessEntity")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper=false)
public class AccountAccessEntity extends TemporalEntity {

	private static final long serialVersionUID = -4754594739686465193L;
	@Id
	private String accountAccessId;
	private String identifier;
	private String accountGuid;
	private AccountSubscription access;
}
