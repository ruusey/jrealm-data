package com.jrealm.data.entity.auth;

import java.sql.Timestamp;
import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document("account_property")
@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class AccountPropertyEntity extends TemporalEntity {
	private static final long serialVersionUID = -8541553300204408886L;
	@Id
	private String accountPropertyId;
	private String identifier;
	private String accountId;
	private String key;
	private String value;
	private Timestamp expires;

	public AccountPropertyEntity(String accountPropertyId, String identifier, String accountId, String key,
			String value, Date expires) {
		this.accountPropertyId = accountPropertyId;
		this.accountId = accountId;
		this.identifier = identifier;
		this.key = key;
		this.value = value;
		if (expires != null) {
			this.expires = new Timestamp(expires.getTime());
		}
	}
}
