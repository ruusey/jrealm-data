package com.jrealm.data.util;


import java.security.SecureRandom;
import java.sql.Timestamp;
import java.text.DecimalFormat;
import java.time.Instant;
import java.util.Base64;
import java.util.Calendar;

import javax.servlet.http.HttpServletRequest;

public class Util {
	private static final SecureRandom secureRandom = new SecureRandom(); // threadsafe
	private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder(); // threadsafe
	private static final long K = 1024;
	private static final long M = Util.K * Util.K;
	private static final long G = Util.M * Util.K;
	private static final long T = Util.G * Util.K;
	private static String AlphaNumericString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "0123456789";

	public static void main(String[] args) {
		String test = "94000130 fdff0000\r\n" + "b21c4d28 00000000\r\n" + "b0000004 00000000\r\n"
				+ "94000130 feff0000\r\n" + "00000890 01ed0001\r\n" + "d0000000 00000000\r\n" + "da000000 00000892\r\n"
				+ "dc000000 00024620\r\n" + "c0000000 0000000b\r\n" + "d7000000 00000000\r\n" + "dc000000 00000006\r\n"
				+ "d2000000 00000000";

		System.out.println(test.replaceAll("\r\n", "+"));

	}

	public static String convertToStringRepresentation(final long value) {
		final long[] dividers = new long[]{Util.T, Util.G, Util.M, Util.K, 1};
		final String[] units = new String[]{"TB", "GB", "MB", "KB", "B"};
		if (value < 1)
			throw new IllegalArgumentException("Invalid file size: " + value);
		String result = null;
		for (int i = 0; i < dividers.length; i++) {
			final long divider = dividers[i];
			if (value >= divider) {
				result = Util.format(value, divider, units[i]);
				break;
			}
		}
		return result;
	}

	private static String format(final long value, final long divider, final String unit) {
		final double result = divider > 1 ? (double) value / (double) divider : (double) value;
		return new DecimalFormat("#,##0.#").format(result) + " " + unit;
	}

	public static String generateNewToken() {
		byte[] randomBytes = new byte[24];
		Util.secureRandom.nextBytes(randomBytes);
		return Util.base64Encoder.encodeToString(randomBytes);
	}

	public static Timestamp getCurrentTime() {
		return new Timestamp(Instant.now().toEpochMilli());
	}

	public static Timestamp getNewTokenExp() {
		Calendar cal = Calendar.getInstance();
		cal.setTime(new Timestamp(Instant.now().toEpochMilli()));
		cal.add(Calendar.DAY_OF_WEEK, 2);
		Timestamp timestamp = new Timestamp(cal.getTime().getTime());
		return timestamp;
	}

	public static String randomAlphaString(int n) {
		StringBuilder sb = new StringBuilder(n);
		for (int i = 0; i < n; i++) {
			int index = (int) (Util.AlphaNumericString.length() * Util.secureRandom.nextDouble());
			sb.append(Util.AlphaNumericString.charAt(index));
		}
		return sb.toString().toUpperCase();
	}

	public static String getUserSession(HttpServletRequest req) {
		return req != null ? req.getHeader("Authorization") : null;
	}
}
