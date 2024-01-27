package com.jrealm.data.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jrealm.data.repository.GameItemRefRepository;
import com.jrealm.data.repository.PlayerAccountRepository;

@Service
public class PlayerAccountService {
	private final transient PlayerAccountRepository playerAccountRepository;
	private final transient GameItemRefRepository gameItemRefRepository;

	public PlayerAccountService(@Autowired final PlayerAccountRepository playerAccountRepository,
			@Autowired final GameItemRefRepository gameItemRefRepository) {
		this.playerAccountRepository = playerAccountRepository;
		this.gameItemRefRepository = gameItemRefRepository;
	}

}
