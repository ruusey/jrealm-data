package com.jrealm.data.entity.auth;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import com.jrealm.data.dto.auth.AccountProvision;
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
@Table(name = "account_provision")
public class AccountProvisionEntity extends TemporalEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer accountProvisionId;

	@Column(unique = true)
	private String identifier;

	@Column(name = "account_id", length = 100)
	private Integer accountId;

	@Column(name = "provision", length = 100)
	private AccountProvision provision;

}
