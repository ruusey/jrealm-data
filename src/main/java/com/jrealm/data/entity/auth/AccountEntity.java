package com.jrealm.data.entity.auth;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.jrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
@Entity
@Table(name = "account")
@JsonIgnoreProperties(ignoreUnknown = true)
public class AccountEntity extends TemporalEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer accountId;

	@Column(unique = true)
	private Integer externalId;

	@Column(unique = true)
	private String identifier;

	@Column(name = "guid", length = 100)
	private String accountGuid;

	@Column(name = "email", length = 100)
	private String email;

	@Column(name = "name", length = 100)
	private String accountName;

}
