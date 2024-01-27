package com.jrealm.data.controller;

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

import com.jrealm.data.dto.auth.AccountDto;
import com.jrealm.data.dto.auth.CreateTokenRequestDto;
import com.jrealm.data.dto.auth.CreateTokenResponseDto;
import com.jrealm.data.dto.auth.LoginRequestDto;
import com.jrealm.data.dto.auth.SessionTokenDto;
import com.jrealm.data.dto.auth.UserApiTokenDto;
import com.jrealm.data.entity.auth.AccountAuthEntity;
import com.jrealm.data.entity.auth.AccountEntity;
import com.jrealm.data.service.AccountService;
import com.jrealm.data.util.ApiUtils;


@RestController
public class AccountController {
	private transient final AccountService jrealmAccounts;

	public AccountController(@Autowired final AccountService clabAccount) {
		this.jrealmAccounts = clabAccount;
	}

	@RequestMapping(value = "/admin/account", method = RequestMethod.PUT, produces = { "application/json" })

	public ResponseEntity<?> updateAccount(final HttpServletRequest req, @RequestBody final AccountDto account) {
		ResponseEntity<?> res = null;
		try {
			final AccountEntity updatedAccount = this.jrealmAccounts.updateAccountAndAuth(account);
			res = ApiUtils.buildSuccess(updatedAccount);
		} catch (final Exception e) {
			final String errMsg = "Failed to update CLAB Account";
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
			final String errMsg = "Failed to get CLAB Account with email " + email;
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account", method = RequestMethod.GET, produces = { "application/json" })
	public ResponseEntity<?> getAccount(final HttpServletRequest req) {
		ResponseEntity<?> res = null;
		try {
			final AccountAuthEntity auth = this.jrealmAccounts.extractAuth(req);
			final AccountDto account = this.jrealmAccounts.getAccountByGuid(auth.getAccountGuid());
			res = ApiUtils.buildSuccess(account);
		} catch (final Exception e) {
			final String errMsg = "Failed to get CLAB Account using headers ";
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/{accountId}", method = RequestMethod.GET, produces = { "application/json" })
	public ResponseEntity<?> getAccount(final HttpServletRequest req, @PathVariable final Integer accountId) {
		ResponseEntity<?> res = null;
		try {
			final AccountDto account = this.jrealmAccounts.getAccountById(accountId);
			res = ApiUtils.buildSuccess(account);
		} catch (final Exception e) {
			final String errMsg = "Failed to get CLAB Account using headers ";
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
			final String errMsg = "Failed to get All CLAB Accounts using headers ";
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
			final String errMsg = "Error trying to login CLAB Account " + login.getEmail();
			res = ApiUtils.buildAndLogError(errMsg, e.getMessage());
		}
		return res;
	}

	@RequestMapping(value = "/admin/account/learner-login", method = RequestMethod.POST, produces = {
	"application/json" })
	public ResponseEntity<?> learnerLogin(final HttpServletRequest request, @RequestBody final LoginRequestDto login) {
		ResponseEntity<?> res = null;
		try {
			final SessionTokenDto userToken = this.jrealmAccounts.learnerLogin(login);
			if (userToken != null) {
				res = ApiUtils.buildSuccess(userToken);
			} else {
				final String errMsg = "Unable to retrieve session token for account " + login.getEmail();
				final String exception = "Login failed, make sure a learner account with email" + login.toString()
				+ " exists";
				res = ApiUtils.buildAndLogError(errMsg, exception);
			}
		} catch (final Exception e) {
			final String errMsg = "Login failed for user with email " + login.getEmail();
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
			res = ApiUtils.buildSuccess(created);
		} catch (final Exception e) {
			final String errMsg = "Failed to register CLAB Account";
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
