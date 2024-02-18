package com.jrealm.data.entity.auth;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jrealm.data.dto.auth.AccountSubscription;
import com.jrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;


@Document("account_access")
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
