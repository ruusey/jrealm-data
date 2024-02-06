package com.jrealm.data.entity.auth;

import java.util.Calendar;
import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jrealm.data.entity.TemporalEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("account_auth")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
