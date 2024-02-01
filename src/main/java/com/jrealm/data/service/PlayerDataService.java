package com.jrealm.data.service;

import java.util.UUID;
import java.time.Instant;
import java.util.Optional;

import org.hibernate.mapping.Set;
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
import com.jrealm.game.data.GameDataManager;
import com.jrealm.game.entity.item.GameItem;

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
		final long start = Instant.now().toEpochMilli();
		final PlayerAccountEntity account = PlayerAccountEntity.builder().accountEmail(email).accountName(accountName)
				.accountUuid(PlayerDataService.randomUuid()).build();
		// Save the account with no joined characters or vault chests
		//account = this.playerAccountRepository.save(account);
		
		// Save the empty chest for this account
		final ChestEntity initialChest = ChestEntity.builder().chestUuid(PlayerDataService.randomUuid()).ordinal(0).build();
		// Create a new GameItem and put it in this chest
		final GameItemRefEntity gameItemDBow = GameItemRefEntity.from(0, 47);

		initialChest.addItem(gameItemDBow);

		// Re-save the chest with item
		
		// Build a character from the provided classId, give it a weapon and give it default stats from GameDataManager and save it
		final CharacterEntity character = CharacterEntity.builder().characterClass(characterClass).build();

		final GameItemRefEntity gameItemDirk = GameItemRefEntity.from(0, 49);
		final CharacterStatsEntity characterStats = CharacterStatsEntity.characterDefaults(characterClass);
		character.setStats(characterStats);
		character.addItem(gameItemDirk);


		account.addCharacter(character);
		account.addChest(initialChest);
		
		final PlayerAccountEntity finalAccount = this.playerAccountRepository.save(account);
		
		this.replaceChestItem(initialChest.getChestUuid(), gameItemDBow.getItemUuid(), null);
		log.info("Successfully created account for user {} in {}ms", finalAccount.getAccountEmail(), (Instant.now().toEpochMilli()-start));
		return this.mapper.map(finalAccount, PlayerAccountDto.class);
	}
	
	public boolean replaceChestItem(final String chestUuid, final String targetItemUuid, final GameItemRefEntity replacement) throws Exception{
		final ChestEntity targetChest = this.playerChestRepository.findByChestUuid(chestUuid);
		boolean success = false;
		if(targetChest==null) {
			throw new Exception("Chest with UUID "+chestUuid+" does not exist");
		}
		final GameItemRefEntity targetItem = this.gameItemRefRepository.findByItemUuid(targetItemUuid);
		if(targetItem==null) {
			throw new Exception("Target item with UUID "+targetItemUuid+ " does not exist");
		}
		if(replacement==null) {
			Optional<GameItemRefEntity> itemInChest = targetChest.getItems().stream().filter(item->item.getItemUuid().equals(targetItemUuid)).findAny();
			if(itemInChest.isEmpty()) {
				throw new Exception("Target item with UUID "+targetItemUuid+ " does not exist in chest with UUID "+chestUuid );
			}
			final GameItemRefEntity toRemove = itemInChest.get();
			success = targetChest.removeItem(targetItem);
			this.deleteGameItem(toRemove);
		}else {
			// TODO: Impl swap
		}
		//this.playerChestRepository.save(targetChest);
		return success;
	}
	
	public void deleteGameItem(final GameItemRefEntity toDelete) throws Exception{
		this.gameItemRefRepository.delete(toDelete.getItemUuid());
	}
	
	public void deleteGameItem(final String gameItemUuid) throws Exception {
		GameItemRefEntity toDelete = this.gameItemRefRepository.findByItemUuid(gameItemUuid);
		if(toDelete==null) {
			throw new Exception("GameItem with UUID "+ gameItemUuid+ " does not exist");
		}
		
		this.gameItemRefRepository.delete(toDelete.getItemUuid());
	}
	
	public PlayerAccountDto getAccountById(final Integer accountId) throws Exception {
		Optional<PlayerAccountEntity> entity = this.playerAccountRepository.findById(accountId);
		if(entity.isPresent()) {
			return mapper.map(entity.get(), PlayerAccountDto.class);
		}else{
			throw new Exception("PlayerAccount with id "+ accountId+" not found");
		}
	}
	
	public PlayerAccountDto getAccountByEmail(final String email) throws Exception {
		Optional<PlayerAccountEntity> entity = this.playerAccountRepository.findByAccountEmail(email);
		if(entity.isPresent()) {
			return mapper.map(entity.get(), PlayerAccountDto.class);
		}else{
			throw new Exception("PlayerAccount with email "+ email+" not found");
		}
	}
	
	public PlayerAccountDto getAccountByUuid(final String accountUuid) throws Exception {
		Optional<PlayerAccountEntity> entity = this.playerAccountRepository.findByAccountUuid(accountUuid);
		if(entity.isPresent()) {
			return mapper.map(entity.get(), PlayerAccountDto.class);
		}else{
			throw new Exception("PlayerAccount with account UUID "+ accountUuid+" not found");
		}
	}
	
	private GameItemRefEntity newGameItem(final int gameItemId) throws Exception{
		GameItem model = GameDataManager.GAME_ITEMS.get(gameItemId);
		if(model == null) {
			throw new IllegalArgumentException("GameItem with id "+gameItemId+" does not exist.");
		}
		return GameItemRefEntity.builder().itemId(49).itemUuid(randomUuid()).build();
	}
		
	private ChestEntity newChest(final int ordinal) {
		return ChestEntity.builder().ordinal(ordinal).build();
	}
	
	private CharacterEntity newCharacter(final int characterClassId) {
		return CharacterEntity.builder().characterClass(characterClassId).build();
	}
	
	private PlayerAccountEntity newPlayerAccount(final String email, final String accountName) {
		return PlayerAccountEntity.builder().accountEmail(email).accountName(accountName)
				.accountUuid(PlayerDataService.randomUuid()).build();
	}

	public static String randomUuid() {
		return UUID.randomUUID().toString();
	}
}
