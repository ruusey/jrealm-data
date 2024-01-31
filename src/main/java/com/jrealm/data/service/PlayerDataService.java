package com.jrealm.data.service;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import com.jrealm.data.dto.PlayerAccountDto;
import com.jrealm.data.entity.CharacterEntity;
import com.jrealm.data.entity.CharacterStatsEntity;
import com.jrealm.data.entity.ChestEntity;
import com.jrealm.data.entity.GameItemRefEntity;
import com.jrealm.data.entity.PlayerAccountEntity;
import com.jrealm.data.repository.CharacterRepository;
import com.jrealm.data.repository.CharacterStatsRepository;
import com.jrealm.data.repository.ChestRepository;
import com.jrealm.data.repository.GameItemRefRepository;
import com.jrealm.data.repository.PlayerAccountRepository;
import com.jrealm.game.contants.CharacterClass;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PlayerDataService {
	private final transient PlayerAccountRepository playerAccountRepository;
	private final transient ChestRepository playerChestRepository;
	private final transient CharacterRepository playerCharacterRepository;
	private final transient CharacterStatsRepository playerStatsRepository;
	private final transient GameItemRefRepository gameItemRefRepository;
	private final transient ModelMapper mapper;

	public PlayerDataService(@Autowired final PlayerAccountRepository playerAccountRepository,
			@Autowired final ChestRepository playerChestRepository,
			@Autowired final CharacterRepository playerCharacterRepository,
			@Autowired final CharacterStatsRepository playerStatsRepository,
			@Autowired final GameItemRefRepository gameItemRefRepository, @Autowired final ModelMapper mapper) {
		this.playerAccountRepository = playerAccountRepository;
		this.playerChestRepository = playerChestRepository;
		this.playerCharacterRepository = playerCharacterRepository;
		this.playerStatsRepository = playerStatsRepository;
		this.gameItemRefRepository = gameItemRefRepository;
		this.mapper = mapper;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void seedAccounts() {
		try {

			if (this.playerAccountRepository.count() == 0L) {
				this.createInitialAccount("ru-admin@jrealm.com", "ruusey", CharacterClass.ROGUE.classId);
			}
		} catch (Exception e) {
			log.error("Failed to seed Player Account. Reason: {}", e);
		}
	}

	public PlayerAccountDto createInitialAccount(final String email, final String accountName,
			final Integer characterClass) throws Exception {
		
		final PlayerAccountEntity account = PlayerAccountEntity.builder().accountEmail(email).accountName(accountName)
				.accountGuid(PlayerDataService.randomUuid()).build();
		// Save the account with no joined characters or vault chests
		//account = this.playerAccountRepository.save(account);
		
		// Save the empty chest for this account
		final ChestEntity initialChest = ChestEntity.builder().ordinal(0).build();
		// Create a new GameItem and put it in this chest
		final GameItemRefEntity gameItemDBow = GameItemRefEntity.builder().gameItemId(47).itemGuid(randomUuid()).build();

		initialChest.addItem(gameItemDBow);
		// Re-save the chest with item
		
		// Build a character from the provided classId, give it a weakpon and give it default stats from GameDataManager and save it
		final CharacterEntity character = CharacterEntity.builder().characterClass(characterClass).build();

		final GameItemRefEntity gameItemDirk = GameItemRefEntity.builder().gameItemId(49).itemGuid(randomUuid()).build();
		final CharacterStatsEntity characterStats = CharacterStatsEntity.characterDefaults(characterClass);
		character.setStats(characterStats);
		character.addItem(gameItemDirk);
		//character = this.playerCharacterRepository.save(character);

		// Give the account reference to the character and chest we just saved
		// and re-save it.

		account.addCharacter(character);
		account.addChest(initialChest);
		
		final PlayerAccountEntity finalAccount = this.playerAccountRepository.save(account);
		return this.mapper.map(finalAccount, PlayerAccountDto.class);
	}

	private static String randomUuid() {
		return UUID.randomUUID().toString();
	}
}
