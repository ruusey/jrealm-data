package com.jrealm.data.entity;

import java.io.Serializable;
import java.util.Date;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemporalEntity implements Serializable {

	private static final long serialVersionUID = -2918875484918650097L;

	@CreatedDate
	private Date created;
	@LastModifiedDate
	private Date updated;
	private Date deleted;
}
