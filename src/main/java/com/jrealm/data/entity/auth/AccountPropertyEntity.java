package com.jrealm.data.entity.auth;

import java.sql.Timestamp;
import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import com.jrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
@Entity
@Table(name = "account_property")
public class AccountPropertyEntity extends TemporalEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer accountPropertyId;
	@Column(unique = true)
	private String identifier;
	@Column(name = "account_id")
	private Integer accountId;

	@Column(name = "key_name", length = 50)
	private String key;

	@Column(name = "value", columnDefinition = "TEXT")
	private String value;

	@Column(name = "expires")
	private Timestamp expires;

	public AccountPropertyEntity(Integer accountPropertyId, String identifier, Integer accountId, String key,
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
