package com.openrealm.data.entity.auth;

import java.util.Calendar;
import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import com.openrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document("account_auth")
@TypeAlias("com.jrealm.data.entity.auth.AccountAuthEntity")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class AccountAuthEntity extends TemporalEntity {
	private static final long serialVersionUID = 2284941915967483605L;
	@Id
	private String accountAuthId;
	private String identifier;

	private String accountGuid;
	private String password;
	private String sessionToken;
	private Date tokenExpires;

	public boolean isExpiredOrEmpty() {
		if (this.tokenExpires == null)
			return true;
		return Calendar.getInstance().getTime().after(this.getTokenExpires());
	}
}
