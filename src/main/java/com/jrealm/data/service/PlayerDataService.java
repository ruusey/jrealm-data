package com.jrealm.data.service;

import java.util.Set;
import java.util.UUID;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import com.jrealm.data.dto.CharacterDto;
import com.jrealm.data.dto.CharacterDto.CharacterDtoBuilder;
import com.jrealm.data.dto.CharacterStatsDto;
import com.jrealm.data.dto.ChestDto;
import com.jrealm.data.dto.ChestDto.ChestDtoBuilder;
import com.jrealm.data.dto.GameItemRefDto;
import com.jrealm.data.dto.PlayerAccountDto;
import com.jrealm.data.dto.PlayerAccountDto.PlayerAccountDtoBuilder;
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
		final PlayerAccountDtoBuilder account = PlayerAccountDto.builder().accountEmail(email).accountName(accountName)
				.accountGuid(PlayerDataService.randomUuid());

		final ChestDtoBuilder initialChest = ChestDto.builder().ordinal(0);

		final GameItemRefDto gameItemDirk = GameItemRefDto.builder().gameItemId(49).itemGuid(randomUuid()).build();

		final GameItemRefDto gameItemDBow = GameItemRefDto.builder().gameItemId(47).itemGuid(randomUuid()).build();
		initialChest.items(Set.of(gameItemDBow));

		final CharacterStatsDto characterStats = CharacterStatsDto.characterDefaults(characterClass);
		final CharacterDtoBuilder character = CharacterDto.builder().characterClass(characterClass)
				.stats(characterStats);
		character.items(Set.of(gameItemDirk));
		account.characters(Set.of(character.build()));
		account.playerVault(Set.of(initialChest.build()));

		PlayerAccountEntity mappedAccount = this.mapper.map(account.build(), PlayerAccountEntity.class);

		//mappedAccount = this.playerAccountRepository.save(mappedAccount);
//		GameItemRefEntity dirkResult = this.gameItemRefRepository.save(mapper.map(gameItemDirk, GameItemRefEntity.class));
//		GameItemRefEntity dbowResult = this.gameItemRefRepository.save(mapper.map(gameItemDBow, GameItemRefEntity.class));
		ChestEntity test = this.playerChestRepository.save(this.mapper.map(initialChest.build(), ChestEntity.class));
		return this.mapper.map(mappedAccount, PlayerAccountDto.class);

	}

	private static String randomUuid() {
		return UUID.randomUUID().toString();
	}
}
