package com.jrealm.data.service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrealm.data.dto.auth.AccountDto;
import com.jrealm.data.dto.auth.AccountProvision;
import com.jrealm.data.dto.auth.AccountSubscription;
import com.jrealm.data.dto.auth.CreateTokenRequestDto;
import com.jrealm.data.dto.auth.CreateTokenResponseDto;
import com.jrealm.data.dto.auth.LoginRequestDto;
import com.jrealm.data.dto.auth.SessionTokenDto;
import com.jrealm.data.dto.auth.UserApiTokenDto;
import com.jrealm.data.entity.auth.AccountAccessEntity;
import com.jrealm.data.entity.auth.AccountAuthEntity;
import com.jrealm.data.entity.auth.AccountEntity;
import com.jrealm.data.entity.auth.AccountEntity.AccountEntityBuilder;
import com.jrealm.data.entity.auth.AccountPropertyEntity;
import com.jrealm.data.entity.auth.AccountProvisionEntity;
import com.jrealm.data.entity.auth.AccountTokenEntity;
import com.jrealm.data.repository.auth.AccountAccessRepository;
import com.jrealm.data.repository.auth.AccountAuthRepository;
import com.jrealm.data.repository.auth.AccountPropertyRepository;
import com.jrealm.data.repository.auth.AccountProvisionRepository;
import com.jrealm.data.repository.auth.AccountRepository;
import com.jrealm.data.repository.auth.AccountTokenRepository;
import com.jrealm.data.util.SHAHash;
import com.jrealm.data.util.SHAValidate;
import com.jrealm.data.util.Util;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AccountService {
	private final transient AccountAuthRepository authRepo;
	private final transient AccountTokenRepository tokenRepo;
	private final transient AccountPropertyRepository propertyRepo;
	private final transient AccountProvisionRepository provisionRepo;
	private final transient AccountRepository accountRepo;
	private final transient AccountAccessRepository accessRepo;

	public AccountService(@Autowired final AccountAuthRepository authRepo,
			@Autowired final AccountTokenRepository tokenRepo, @Autowired final AccountPropertyRepository propertyRepo,
			@Autowired final AccountProvisionRepository provisionRepo, @Autowired final AccountRepository accountRepo,
			@Autowired final AccountAccessRepository accessRepo) {
		this.authRepo = authRepo;
		this.tokenRepo = tokenRepo;
		this.propertyRepo = propertyRepo;
		this.provisionRepo = provisionRepo;
		this.accountRepo = accountRepo;
		this.accessRepo = accessRepo;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Order(1)
	public void seedAccounts() {
		try {

			if (this.accountRepo.count() == 0L) {
				ObjectMapper mapper = new ObjectMapper();
				InputStream inputStream = this.getClass().getResourceAsStream("/account_seed.json");
				String text = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);

				AccountDto[] accounts = mapper.readValue(text, AccountDto[].class);

				for (AccountDto account : accounts) {
					AccountService.log.info("Seeded account {}", this.registerJrealmAccount(account));
				}
			}
		} catch (Exception e) {
			AccountService.log.error("Failed to seed Accounts", e);
		}
	}

	public AccountEntity saveAccountDetails(AccountDto account) {
		AccountEntityBuilder accountBuilder = AccountEntity.builder().email(account.getEmail())
				.accountName(account.getAccountName());

		if (account.getAccountGuid() != null) {
			accountBuilder.accountGuid(account.getAccountGuid());
		} else {
			accountBuilder.accountGuid(UUID.randomUUID().toString());
		}

		if (account.getAccountId() != null) {
			accountBuilder.accountId(account.getAccountId());
		}

		if ((account.getExternalId() != null) && (account.getExternalId() > 0)) {
			accountBuilder.externalId(account.getExternalId());
		}
		AccountEntity saved = this.accountRepo.save(accountBuilder.build());

		account.getAccountProvisions().forEach(provision -> {
			AccountProvisionEntity provisionEntity = AccountProvisionEntity.builder().accountId(saved.getAccountId())
					.provision(provision).build();
			this.provisionRepo.save(provisionEntity);
		});

		account.getAccountSubscriptions().forEach(subscription -> {
			AccountAccessEntity accessEntity = AccountAccessEntity.builder().accountGuid(saved.getAccountGuid())
					.access(subscription).build();
			this.accessRepo.save(accessEntity);
		});

		if (account.getAccountProperties() != null) {
			account.getAccountProperties().entrySet().forEach(property -> {
				AccountPropertyEntity propertyEntity = AccountPropertyEntity.builder().accountId(saved.getAccountId())
						.key(property.getKey()).value(property.getValue()).build();
				this.propertyRepo.save(propertyEntity);
			});
		}
		return saved;
	}

	public AccountEntity updateAccountAndAuth(AccountDto account) throws Exception {
		AccountEntity accountEntity = this.saveAccountDetails(account);

		if ((account.getPassword() != null) && !StringUtils.isBlank(account.getPassword())) {
			AccountAuthEntity accountAuth = this.authRepo.findByAccountGuid(accountEntity.getAccountGuid());

			String sessionToken = Util.generateNewToken();
			Timestamp tokenExp = Util.getNewTokenExp();
			String hashedPass = SHAHash.generateStrongPasswordHash(account.getPassword());

			accountAuth.setSessionToken(sessionToken);
			accountAuth.setPassword(hashedPass);
			accountAuth.setTokenExpires(tokenExp);
			this.authRepo.save(accountAuth);
		}
		return accountEntity;
	}

	public SessionTokenDto updateAuthAndLogin(AccountDto account) throws Exception {

		if ((account.getPassword() != null) && !StringUtils.isBlank(account.getPassword())) {
			AccountAuthEntity accountAuth = this.authRepo.findByAccountGuid(account.getAccountGuid());

			String sessionToken = Util.generateNewToken();
			Timestamp tokenExp = Util.getNewTokenExp();
			String hashedPass = SHAHash.generateStrongPasswordHash(account.getPassword());

			accountAuth.setSessionToken(sessionToken);
			accountAuth.setPassword(hashedPass);
			accountAuth.setTokenExpires(tokenExp);
			accountAuth = this.authRepo.save(accountAuth);
		}
		SessionTokenDto session = null;
		try {
			session = this.login(new LoginRequestDto(account.getEmail(), account.getPassword()));
		} catch (Exception e) {
			AccountService.log.error("Error while updating account auth {}", e.getMessage());
		}
		return session;
	}

	public AccountEntity registerJrealmAccount(AccountDto account) throws Exception {
		try {
			AccountEntity existing = this.accountRepo.findByEmail(account.getEmail());
			if (existing != null) {
				AccountService.log.info("GCN user {} already Exists", account);
				return null;
			}

			AccountEntity accountEntity = this.saveAccountDetails(account);

			String sessionToken = Util.generateNewToken();
			Timestamp tokenExp = Util.getNewTokenExp();
			String hashedPass = SHAHash.generateStrongPasswordHash(account.getPassword());
			AccountAuthEntity auth = AccountAuthEntity.builder().accountGuid(accountEntity.getAccountGuid())
					.password(hashedPass).sessionToken(sessionToken).tokenExpires(tokenExp).build();
			this.authRepo.save(auth);

			return accountEntity;
		} catch (Exception e) {
			AccountService.log.error("Error registering account [" + e.getMessage() + "]");
		}
		return null;
	}

	public CreateTokenResponseDto createApiToken(CreateTokenRequestDto req) {
		AccountTokenEntity token = AccountTokenEntity.builder().accountGuid(req.getAccountGuid())
				.tokenName(req.getTokenName()).token(Util.randomAlphaString(64)).build();
		AccountTokenEntity saved = this.tokenRepo.save(token);

		return CreateTokenResponseDto.builder().id(saved.getAccountTokenId()).token(saved.getToken())
				.tokenName(saved.getTokenName()).build();
	}

	public List<UserApiTokenDto> getUserApiTokens(String accountGuid) {
		List<UserApiTokenDto> userTokens = new ArrayList<>();

		List<AccountTokenEntity> tokenEntities = this.tokenRepo.findAllByAccountGuid(accountGuid);
		tokenEntities.forEach(token -> {
			userTokens.add(UserApiTokenDto.builder().userTokenId(token.getAccountTokenId())
					.tokenName(token.getTokenName()).build());
		});
		return userTokens;
	}

	public boolean validateApiToken(String apiToken) {
		return this.tokenRepo.findByToken(apiToken) != null;
	}

	public SessionTokenDto login(LoginRequestDto request) throws Exception {
		try {
			AccountDto account = this.getAccountByEmail(request.getEmail());
			AccountAuthEntity auth = this.authRepo.findByAccountGuid(account.getAccountGuid());
			String txtPassword = request.getPassword();
			if (SHAValidate.validatePassword(txtPassword, auth.getPassword())) {
				this.refreshSession(auth);
				return SessionTokenDto.builder().expires(auth.getTokenExpires()).accountGuid(account.getAccountGuid())
						.token(auth.getSessionToken()).build();
			}
			throw new IllegalArgumentException("Login information does not match");
		} catch (Exception e) {
			AccountService.log.error("Error during user login {}", e.getMessage());
		}
		return null;
	}

	public SessionTokenDto learnerLogin(LoginRequestDto request) throws Exception {
		try {
			AccountDto account = this.getAccountByEmail(request.getEmail());
			AccountAuthEntity auth = this.authRepo.findByAccountGuid(account.getAccountGuid());
			if (account.getAccountSubscriptions().contains(AccountSubscription.TRIAL)) {
				this.refreshSession(auth);
				return SessionTokenDto.builder().expires(auth.getTokenExpires()).accountGuid(account.getAccountGuid())
						.token(auth.getSessionToken()).build();
			}
		} catch (Exception e) {
			AccountService.log.error("Error during user login {}", e.getMessage());
		}
		return null;
	}

	public boolean logout(AccountAuthEntity auth) {
		auth.setSessionToken(null);
		auth.setTokenExpires(null);
		return this.authRepo.save(auth).getSessionToken() == null;
	}

	private void refreshSession(AccountAuthEntity auth) {
		String sessionToken = Util.generateNewToken();
		Timestamp tokenExp = Util.getNewTokenExp();
		auth.setTokenExpires(tokenExp);
		auth.setSessionToken(sessionToken);
		this.authRepo.save(auth);
	}

	public AccountAuthEntity getUserAuthBySession(String sessionToken) {
		return this.authRepo.findBySessionToken(sessionToken);
	}

	public AccountAuthEntity getUserAuthByBearerToken(String bearerToken) {
		AccountTokenEntity token = this.tokenRepo.findByToken(bearerToken);
		return AccountAuthEntity.builder().accountGuid(token.getAccountGuid()).build();
	}

	public AccountDto getAccountByEmail(String email) throws Exception {
		AccountService.log.info("Getting account information for email={}", email);
		AccountEntity account = this.accountRepo.findByEmail(email);
		if (account == null)
			throw new Exception("No account with email " + email + " was found.");
		return this.getAccountById(account.getAccountId());
	}

	public AccountDto getAccountByExternalId(Integer externalId) throws Exception {
		AccountService.log.info("Getting account information for externalId={}", externalId);
		AccountEntity account = this.accountRepo.findByExternalId(externalId);
		if (account == null)
			throw new Exception("No account with findByExternalId " + externalId + " was found.");
		return this.getAccountById(account.getAccountId());
	}

	public AccountDto getAccountByGuid(String guid) {
		AccountEntity account = this.accountRepo.findByAccountGuid(guid);
		// log.info("Getting account information for email={}", account.getEmail());
		return this.getAccountById(account.getAccountId());
	}

	public List<AccountDto> getAllAccounts(Integer page, Integer size) {
		Page<AccountEntity> accounts = this.accountRepo.findAll(PageRequest.of(page, size));
		List<AccountDto> results = new ArrayList<>();
		for (AccountEntity acc : accounts) {
			results.add(this.getAccountById(acc.getAccountId()));
		}
		return results;
	}

	public List<AccountDto> getAllAccounts() {
		Iterable<AccountEntity> accounts = this.accountRepo.findAll();
		List<AccountDto> results = new ArrayList<>();
		for (AccountEntity acc : accounts) {
			results.add(this.getAccountById(acc.getAccountId()));
		}
		return results;
	}

	public List<AccountDto> getAllAccountsWithSubscription(AccountSubscription toCheck) {
		Iterable<AccountEntity> accounts = this.accountRepo.findAll();
		List<AccountDto> results = new ArrayList<>();
		for (AccountEntity acc : accounts) {
			AccountDto res = this.getAccountById(acc.getAccountId());
			if (res.getAccountSubscriptions().contains(toCheck)) {
				results.add(res);
			}
		}
		return results;
	}

	public void deleteAccount(String guid) throws Exception {
		AccountEntity account = this.accountRepo.findByAccountGuid(guid);
		List<AccountPropertyEntity> properties = this.propertyRepo.findAllByAccountId(account.getAccountId());
		List<AccountProvisionEntity> provisions = this.provisionRepo.findAllByAccountId(account.getAccountId());
		List<AccountAccessEntity> subscriptions = this.accessRepo.findAllByAccountGuid(account.getAccountGuid());
		AccountAuthEntity auth = this.authRepo.findByAccountGuid(guid);

		this.authRepo.delete(auth);
		properties.forEach(prop -> {
			this.propertyRepo.delete(prop);
		});
		provisions.forEach(prov -> {
			this.provisionRepo.delete(prov);
		});
		subscriptions.forEach(sub -> {
			this.accessRepo.delete(sub);
		});

		this.accountRepo.delete(account);
		AccountService.log.info("Successfully deleted Account [{}]", account.getEmail());
	}

	public AccountDto getAccountById(String accountId) {
		AccountEntity account = null;
		try {
			account = this.accountRepo.findById(accountId).get();
		} catch (Exception e) {
			return null;
		}
		List<AccountPropertyEntity> properties = this.propertyRepo.findAllByAccountId(account.getAccountId());
		List<AccountProvisionEntity> provisions = this.provisionRepo.findAllByAccountId(account.getAccountId());
		List<AccountAccessEntity> subscriptions = this.accessRepo.findAllByAccountGuid(account.getAccountGuid());

		Map<String, String> accProperties = new HashMap<>();
		List<AccountProvision> accProvisions = new ArrayList<>();
		List<AccountSubscription> accSubscriptions = new ArrayList<>();
		properties.forEach(property -> {
			accProperties.put(property.getKey(), property.getValue());
		});
		provisions.forEach(provision -> {
			accProvisions.add(provision.getProvision());
		});
		subscriptions.forEach(subscription -> {
			accSubscriptions.add(subscription.getAccess());
		});

		return AccountDto.builder().accountId(account.getAccountId()).externalId(account.getExternalId())
				.email(account.getEmail()).accountGuid(account.getAccountGuid()).accountName(account.getAccountName())
				.accountProperties(accProperties).accountProvisions(accProvisions)
				.accountSubscriptions(accSubscriptions).build();
	}

	public List<AccountAccessEntity> getAccountSubscriptions(String guid) {
		List<AccountAccessEntity> subscriptions = this.accessRepo.findAllByAccountGuid(guid);
		return subscriptions;
	}

	public AccountAuthEntity extractAuth(HttpServletRequest request) throws Exception {
		String sessionToken = Util.getUserSession(request);
		AccountAuthEntity auth = null;
		if (sessionToken == null)
			throw new Exception("No session token provided");
		if (sessionToken.contains("bearer") || sessionToken.contains("Bearer")) {
			sessionToken = sessionToken.split(" ")[1];
			auth = this.getUserAuthByBearerToken(sessionToken);
		} else {
			auth = this.getUserAuthBySession(sessionToken);
		}
		return auth;
	}

}
