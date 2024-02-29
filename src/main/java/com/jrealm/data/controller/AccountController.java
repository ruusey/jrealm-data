package com.jrealm.data.controller;

import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jrealm.data.dto.PingResponseDto;
import com.jrealm.data.dto.auth.AccountDto;
import com.jrealm.data.dto.auth.CreateTokenRequestDto;
import com.jrealm.data.dto.auth.CreateTokenResponseDto;
import com.jrealm.data.dto.auth.LoginRequestDto;
import com.jrealm.data.dto.auth.SessionTokenDto;
import com.jrealm.data.dto.auth.UserApiTokenDto;
import com.jrealm.data.entity.auth.AccountAuthEntity;
import com.jrealm.data.entity.auth.AccountEntity;
import com.jrealm.data.service.AccountService;
import com.jrealm.data.service.PlayerDataService;
import com.jrealm.data.util.ApiUtils;


@RestController
public class AccountController {
	private transient final AccountService jrealmAccounts;
	private transient final PlayerDataService jrealmData;

	public AccountController(@Autowired final AccountService jrealmAccountService,
			@Autowired final PlayerDataService jrealmData) {
		this.jrealmAccounts = jrealmAccountService;
		this.jrealmData = jrealmData;
	}

	@RequestMapping(value = "/ping", method = RequestMethod.GET, produces = { "application/json" })
	public ResponseEntity<?> ping(final HttpServletRequest req) {
		ResponseEntity<?> res = null;
		try {
			PingResponseDto response = PingResponseDto.builder().time(new Date().toString()).status("UP").build();
			res = ApiUtils.buildSuccess(response);
		} catch (final Exception e) {
			final String errMsg = "Failed to get JRealm Account using headers ";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account", method = RequestMethod.PUT, produces = { "application/json" })
	public ResponseEntity<?> updateAccount(final HttpServletRequest req, @RequestBody final AccountDto account) {
		ResponseEntity<?> res = null;
		try {
			final AccountEntity updatedAccount = this.jrealmAccounts.updateAccountAndAuth(account);
			res = ApiUtils.buildSuccess(updatedAccount);
		} catch (final Exception e) {
			final String errMsg = "Failed to update JRealm Account";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/email/{email}", method = RequestMethod.GET, produces = {
	"application/json" })
	public ResponseEntity<?> getAccountByEmail(final HttpServletRequest req, @PathVariable final String email) {
		ResponseEntity<?> res = null;
		try {
			final AccountDto account = this.jrealmAccounts.getAccountByEmail(email);
			res = ApiUtils.buildSuccess(account);
		} catch (final Exception e) {
			final String errMsg = "Failed to get JRealm Account with email " + email;
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/{accountGuid}", method = RequestMethod.GET, produces = { "application/json" })
	public ResponseEntity<?> getAccount(final HttpServletRequest req, @PathVariable final String accountGuid) {
		ResponseEntity<?> res = null;
		try {
			final AccountDto account = this.jrealmAccounts.getAccountByGuid(accountGuid);
			res = ApiUtils.buildSuccess(account);
		} catch (final Exception e) {
			final String errMsg = "Account with UUID "+accountGuid+" does not exist.";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/all", method = RequestMethod.GET, produces = { "application/json" })
	public ResponseEntity<?> getAllAccountsByPage(final HttpServletRequest req,
			@RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
		ResponseEntity<?> res = null;
		if ((page == null) || (size == null)) {
			page = size = 0;
		}
		try {
			final List<AccountDto> accounts = this.jrealmAccounts.getAllAccounts(page, size);
			res = ApiUtils.buildSuccess(accounts);
		} catch (final Exception e) {
			final String errMsg = "Failed to get All JRealm Accounts using headers ";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/login", method = RequestMethod.POST, produces = { "application/json" })
	public ResponseEntity<?> login(final HttpServletRequest request, @RequestBody final LoginRequestDto login) {
		ResponseEntity<?> res = null;
		try {
			final SessionTokenDto userToken = this.jrealmAccounts.login(login);
			res = ApiUtils.buildSuccess(userToken);
		} catch (final Exception e) {
			final String errMsg = "Error trying to login JRealm Account " + login.getEmail();
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/logout", method = RequestMethod.POST, produces = { "application/json" })
	public ResponseEntity<?> logout(final HttpServletRequest req) {
		ResponseEntity<?> res = null;
		try {
			final AccountAuthEntity auth = this.jrealmAccounts.extractAuth(req);
			final boolean loggedOut = this.jrealmAccounts.logout(auth);
			res = ApiUtils.buildSuccess(loggedOut);
		} catch (final Exception e) {
			final String errMsg = "Logout failed";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/register", method = RequestMethod.POST, produces = { "application/json" })
	public ResponseEntity<?> createAccount(final HttpServletRequest request,
			@RequestBody final AccountDto account) {
		ResponseEntity<?> res = null;
		try {
			final AccountEntity created = this.jrealmAccounts.registerJrealmAccount(account);
			this.jrealmData.createInitialAccount(created.getAccountGuid(), account.getEmail(), account.getAccountName(),
					0);
			res = ApiUtils.buildSuccess(created);
		} catch (final Exception e) {
			final String errMsg = "Failed to register JRealm Account";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/token", method = RequestMethod.POST, produces = { "application/json" })
	public ResponseEntity<?> createAccountToken(final HttpServletRequest req,
			@RequestBody final CreateTokenRequestDto token) {
		ResponseEntity<?> res = null;
		try {
			final AccountAuthEntity auth = this.jrealmAccounts.extractAuth(req);
			token.setAccountGuid(auth.getAccountGuid());
			final CreateTokenResponseDto created = this.jrealmAccounts.createApiToken(token);
			res = ApiUtils.buildSuccess(created);
		} catch (final Exception e) {
			final String errMsg = "Failed to create Account API Token";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/token", method = RequestMethod.GET, produces = { "application/json" })
	public ResponseEntity<?> getAccountTokens(final HttpServletRequest req) {
		ResponseEntity<?> res = null;
		try {
			final AccountAuthEntity auth = this.jrealmAccounts.extractAuth(req);
			final List<UserApiTokenDto> tokens = this.jrealmAccounts.getUserApiTokens(auth.getAccountGuid());
			res = ApiUtils.buildSuccess(tokens);
		} catch (final Exception e) {
			final String errMsg = "Failed get Account API Token(s)";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}
}
