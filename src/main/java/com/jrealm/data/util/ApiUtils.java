package com.jrealm.data.util;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class ApiUtils {

	public static <T> ResponseEntity<T> buildSuccess(T body) {
		return new ResponseEntity<T>(body, HttpStatus.OK);
	}

	public static ResponseEntity<ErrorResponseObject> buildAndLogError(String msg, String reason) {
		ApiUtils.log.error("CLAB ERROR > [{}] REASON: [{}]", msg, reason);
		return new ResponseEntity<ErrorResponseObject>(ApiUtils.getError(msg, reason), HttpStatus.BAD_REQUEST);
	}

	public static ResponseEntity<ErrorResponseObject> buildError(String msg, String reason, MultiValueMap<String, String> headers) {
		return new ResponseEntity<ErrorResponseObject>(ApiUtils.getError(msg, reason), headers, HttpStatus.BAD_REQUEST);
	}

	public static ResponseEntity<ErrorResponseObject> buildError(String msg, String reason) {
		return new ResponseEntity<ErrorResponseObject>(ApiUtils.getError(msg, reason), HttpStatus.BAD_REQUEST);
	}

	public static ResponseEntity<ErrorResponseObject> buildError(String msg, String reason, HttpStatus status) {
		return new ResponseEntity<ErrorResponseObject>(ApiUtils.getError(msg, reason, status), status);
	}

	public static ErrorResponseObject getError(String message, String reason) {
		return ErrorResponseObject.builder().message(message).reason(reason).build();
	}

	public static ErrorResponseObject getError(String message, String reason, HttpStatus status) {
		return ErrorResponseObject.builder().message(message).reason(reason).status(status).build();
	}

}
