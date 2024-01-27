package com.jrealm.data.entity.auth;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import com.jrealm.data.dto.auth.AccountSubscription;
import com.jrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "account_access")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountAccessEntity extends TemporalEntity {

	private static final long serialVersionUID = -4754594739686465193L;
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer accountAccessId;
	@Column(unique = true)
	private String identifier;

	@Column(name = "guid", length = 100)
	private String accountGuid;

	private AccountSubscription access;
}
