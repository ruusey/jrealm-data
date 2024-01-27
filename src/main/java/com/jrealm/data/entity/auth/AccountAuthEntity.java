package com.jrealm.data.entity.auth;

import java.sql.Timestamp;
import java.util.Calendar;

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

@Entity
@Table(name = "account_auth")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountAuthEntity extends TemporalEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer accountAuthId;
	@Column(unique = true)
	private String identifier;

	@Column(name = "guid", length = 50)
	private String accountGuid;
	@Column(name = "password", length = 200)
	private String password;
	@Column(name = "token", length = 100)
	private String sessionToken;
	@Column(name = "expires")
	private Timestamp tokenExpires;

	public boolean isExpiredOrEmpty() {
		if (this.tokenExpires == null)
			return true;
		return Calendar.getInstance().getTime().after(this.getTokenExpires());
	}
}
