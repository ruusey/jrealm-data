package com.jrealm.data.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateTokenResponseDto {
	private Integer id;
	private String token;
	private String tokenName;
}
