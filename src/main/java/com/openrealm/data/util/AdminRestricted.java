package com.openrealm.data.util;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.lang.annotation.ElementType;
import java.lang.annotation.RetentionPolicy;

import com.openrealm.data.dto.auth.AccountProvision;

/**
 * Marks an API endpoint as restricted. The account must hold at least one
 * provision that satisfies any of the listed provisions.
 * ADMIN and SYS_ADMIN implicitly satisfy all lower provisions.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.METHOD, ElementType.TYPE })
public @interface AdminRestricted {
	AccountProvision[] provisions() default { AccountProvision.OPENREALM_ADMIN };
}
