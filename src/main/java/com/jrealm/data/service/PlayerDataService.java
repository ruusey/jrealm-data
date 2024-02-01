package com.jrealm.data.service;

import java.util.UUID;
import java.time.Instant;
import java.util.Map;
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
	
	public PlayerAccountDto saveAccount(final PlayerAccountDto dto) {
		PlayerAccountEntity entity = this.mapper.map(dto, PlayerAccountEntity.class);
		entity = this.playerAccountRepository.save(entity);
		return this.mapper.map(entity, PlayerAccountDto.class);
	}

	public PlayerAccountDto createInitialAccount(final String email, final String accountName,
			final Integer characterClass) throws Exception {
		final long start = Instant.now().toEpochMilli();
		// Build a new account with a random uuid and the provided email + accountName;
		final PlayerAccountEntity account = PlayerAccountEntity.builder().accountEmail(email).accountName(accountName)
				.accountUuid("db8671a7-66b2-4750-b95c-aaafc4f17e59").build();
		
		// Create a single chest with one item in it
		final ChestEntity initialChest = ChestEntity.builder().chestUuid(PlayerDataService.randomUuid()).ordinal(0).build();
		// Create a new GameItemRef and put it in this chest
		
		final GameItemRefEntity gameItemDBow = GameItemRefEntity.from(0, 47);
		// Add the item to the chest
		initialChest.addItem(gameItemDBow);
		
		// Build a character from the provided classId, give it a weapon and give it default stats from GameDataManager
		final CharacterEntity character = CharacterEntity.builder().characterClass(characterClass).build();
		
		// Equip the player with their starting equipment
		final Map<Integer, GameItem> startingEquip = GameDataManager.getStartingEquipment(CharacterClass.valueOf(characterClass));
		for(int i = 0; i<startingEquip.values().size(); i++) {
			final GameItem toEquip = startingEquip.get(i);
			final GameItemRefEntity toEquipEntity = GameItemRefEntity.from(i, toEquip.getItemId());
			character.addItem(toEquipEntity);
		}
		
		final CharacterStatsEntity characterStats = CharacterStatsEntity.characterDefaults(characterClass);
		character.setStats(characterStats);

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
		final PlayerAccountEntity ownerAccount = targetChest.getOwnerAccount();
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
		this.playerAccountRepository.save(ownerAccount);
		return success;
	}
	
	public void deleteGameItem(final GameItemRefEntity toDelete) {
		this.gameItemRefRepository.delete(toDelete);

	}
	
	public void hardDeleteGameItem(final GameItemRefEntity toDelete) throws Exception{
		this.gameItemRefRepository.delete(toDelete.getItemUuid());
	}
	
	public void hardDeleteGameItem(final String gameItemUuid) throws Exception {
		final GameItemRefEntity toDelete = this.gameItemRefRepository.findByItemUuid(gameItemUuid);
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
