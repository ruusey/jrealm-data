package com.jrealm.data.service;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import com.jrealm.data.dto.CharacterDto;
import com.jrealm.data.dto.GameItemRefDto;
import com.jrealm.data.dto.PlayerAccountDto;
import com.jrealm.data.entity.CharacterEntity;
import com.jrealm.data.entity.CharacterStatsEntity;
import com.jrealm.data.entity.ChestEntity;
import com.jrealm.data.entity.GameItemRefEntity;
import com.jrealm.data.entity.PlayerAccountEntity;
import com.jrealm.data.entity.auth.AccountEntity;
import com.jrealm.data.repository.CharacterRepository;
import com.jrealm.data.repository.ChestRepository;
import com.jrealm.data.repository.GameItemRefRepository;
import com.jrealm.data.repository.PlayerAccountRepository;
import com.jrealm.data.repository.auth.AccountRepository;
import com.jrealm.game.contants.CharacterClass;
import com.jrealm.game.data.GameDataManager;
import com.jrealm.game.entity.item.GameItem;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PlayerDataService {
	private final transient AccountRepository accountRepository;
	private final transient PlayerAccountRepository playerAccountRepository;
	private final transient ChestRepository playerChestRepository;
	private final transient CharacterRepository playerCharacterRepository;
	private final transient GameItemRefRepository gameItemRefRepository;
	private final transient ModelMapper mapper;

	public PlayerDataService(@Autowired final AccountRepository accountRepository,
			@Autowired final PlayerAccountRepository playerAccountRepository,
			@Autowired final ChestRepository playerChestRepository,
			@Autowired final CharacterRepository playerCharacterRepository,
			@Autowired final GameItemRefRepository gameItemRefRepository,
			@Autowired final ModelMapper mapper) {
		this.accountRepository = accountRepository;
		this.playerAccountRepository = playerAccountRepository;
		this.playerChestRepository = playerChestRepository;
		this.playerCharacterRepository = playerCharacterRepository;
		this.gameItemRefRepository = gameItemRefRepository;
		this.mapper = mapper;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Order(2)
	public void seedAccounts() {
		try {

			if (this.playerAccountRepository.count() == 0L) {
				for(AccountEntity account : this.accountRepository.findAll()) {
					this.createInitialAccount(account.getAccountGuid(), account.getEmail(), account.getAccountName(),
							CharacterClass.ROGUE.classId);
				}
			}
		} catch (Exception e) {
			PlayerDataService.log.error("Failed to seed Player Account. Reason: {}", e);
		}
	}

	public CharacterDto saveCharacterStats(final String characterUuid, final CharacterDto newData) throws Exception{
		final long start = Instant.now().toEpochMilli();
		PlayerAccountEntity ownerAccount = this.playerAccountRepository.findByCharactersCharacterUuid(characterUuid);
		CharacterEntity character = ownerAccount
				.findCharacterByUuid(characterUuid);
		if(character==null)
			throw new Exception("Character with UUID "+characterUuid+" was not found.");

		character.getStats().setHp(newData.getStats().getHp());
		character.getStats().setMp(newData.getStats().getMp());
		character.getStats().setDef(newData.getStats().getDef());
		character.getStats().setAtt(newData.getStats().getAtt());
		character.getStats().setSpd(newData.getStats().getSpd());
		character.getStats().setDex(newData.getStats().getDex());
		character.getStats().setWis(newData.getStats().getWis());
		character.getStats().setVit(newData.getStats().getVit());
		character.getStats().setXp(newData.getStats().getXp());

		character.removeItems();

		for(GameItemRefDto item: newData.getItems()) {
			if(item==null) {
				continue;
			}
			GameItemRefEntity itemEntity = this.mapper.map(item, GameItemRefEntity.class);
			character.addItem(itemEntity);
		}

		ownerAccount = this.playerAccountRepository.save(ownerAccount);
		PlayerDataService.log.info("Successfully saved character stats for character {} in {}ms",
				character.getCharacterUuid(), (Instant.now().toEpochMilli() - start));
		return this.mapper.map(character, CharacterDto.class);
	}

	public PlayerAccountDto createCharacter(final String accountUuid, final Integer classId) throws Exception {
		final long start = Instant.now().toEpochMilli();
		final CharacterClass clazz = CharacterClass.valueOf(classId);
		if (clazz == null)
			throw new Exception("Character class with id " + classId + " does not exist");
		PlayerAccountEntity accountEntity = this.playerAccountRepository.findByAccountUuid(accountUuid);
		if (accountEntity == null)
			throw new Exception("Account with with UUID " + accountUuid + " does not exist");
		final CharacterEntity character = CharacterEntity.builder().characterUuid(PlayerDataService.randomUuid())
				.characterClass(classId).build();

		// Equip the player with their starting equipment
		final Map<Integer, GameItem> startingEquip = GameDataManager
				.getStartingEquipment(clazz);
		for (int i = 0; i < startingEquip.values().size(); i++) {
			final GameItem toEquip = startingEquip.get(i);
			final GameItemRefEntity toEquipEntity = GameItemRefEntity.from(i, toEquip.getItemId());
			character.addItem(toEquipEntity);
		}

		final CharacterStatsEntity characterStats = CharacterStatsEntity.characterDefaults(classId);
		character.setStats(characterStats);

		accountEntity.addCharacter(character);

		accountEntity = this.playerAccountRepository.save(accountEntity);
		PlayerDataService.log.info("Successfully created character for account {} in {}ms", accountUuid,
				(Instant.now().toEpochMilli() - start));

		return this.mapper.map(accountEntity, PlayerAccountDto.class);
	}

	public void deleteCharacter(final String characterUuid) throws Exception {
		final long start = Instant.now().toEpochMilli();
		PlayerAccountEntity account = this.playerAccountRepository.findByCharactersCharacterUuid(characterUuid);
		Optional<CharacterEntity> characterToDelete = account.getCharacters().stream().filter(character->character.getCharacterUuid().equals(characterUuid)).findAny();
		if (characterToDelete.isEmpty())
			throw new Exception("Player character with UUID "+characterUuid+" does not exist");
		characterToDelete.get().setDeleted(new Date(Instant.now().toEpochMilli()));
		PlayerDataService.log.info("Successfully deleted character {} in {}ms", characterUuid,
				(Instant.now().toEpochMilli() - start));
		this.playerAccountRepository.save(account);
	}

	public List<CharacterDto> getPlayerCharacters(final String accountUuid) throws Exception {
		PlayerAccountDto account = this.getAccountByUuid(accountUuid);
		if(account==null)
			throw new Exception("Player account with UUID "+ accountUuid+" was not found");
		return account.getCharacters();
	}

	public PlayerAccountDto saveAccount(final PlayerAccountDto dto) {
		PlayerAccountEntity entity = this.mapper.map(dto, PlayerAccountEntity.class);
		entity = this.playerAccountRepository.save(entity);
		return this.mapper.map(entity, PlayerAccountDto.class);
	}

	public PlayerAccountDto createInitialAccount(final String accountUuid, final String email, final String accountName,
			final Integer characterClass) throws Exception {
		final long start = Instant.now().toEpochMilli();
		// Build a new account with a random uuid and the provided email + accountName;
		final PlayerAccountEntity account = PlayerAccountEntity.builder().accountEmail(email).accountName(accountName)
				.accountUuid(accountUuid).build();

		// Create a single chest with one item in it
		final ChestEntity initialChest = ChestEntity.builder().chestUuid(PlayerDataService.randomUuid()).ordinal(0).build();
		// Create a new GameItemRef and put it in this chest

		final GameItemRefEntity gameItemDBow = GameItemRefEntity.from(0, 47);
		// Add the item to the chest
		initialChest.addItem(gameItemDBow);

		// Build a character from the provided classId, give it a weapon and give it default stats from GameDataManager
		final CharacterEntity character = CharacterEntity.builder().characterUuid(PlayerDataService.randomUuid()).characterClass(characterClass).build();

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

		//this.replaceChestItem(initialChest.getChestUuid(), gameItemDBow.getItemUuid(), null);
		PlayerDataService.log.info("Successfully created account for user {} in {}ms", finalAccount.getAccountEmail(), (Instant.now().toEpochMilli()-start));
		return this.mapper.map(finalAccount, PlayerAccountDto.class);
	}

	public boolean replaceChestItem(final String accountUuid, final String chestUuid, final String targetItemUuid, final GameItemRefEntity replacement) throws Exception{
		final PlayerAccountEntity account = this.playerAccountRepository.findByAccountUuid(accountUuid);
		final ChestEntity targetChest = this.playerChestRepository.findByChestUuid(chestUuid);
		boolean success = false;
		if(targetChest==null)
			throw new Exception("Chest with UUID "+chestUuid+" does not exist");
		final GameItemRefEntity targetItem = this.gameItemRefRepository.findByItemUuid(targetItemUuid);
		if(targetItem==null)
			throw new Exception("Target item with UUID "+targetItemUuid+ " does not exist");
		if(replacement==null) {
			Optional<GameItemRefEntity> itemInChest = targetChest.getItems().stream().filter(item->item.getItemUuid().equals(targetItemUuid)).findAny();
			if(itemInChest.isEmpty())
				throw new Exception("Target item with UUID "+targetItemUuid+ " does not exist in chest with UUID "+chestUuid );
			final GameItemRefEntity toRemove = itemInChest.get();
			success = targetChest.removeItem(targetItem);
			this.deleteGameItem(toRemove);
		}else {
			Optional<GameItemRefEntity> itemInChest = targetChest.getItems().stream().filter(item->item.getItemUuid().equals(targetItemUuid)).findAny();
			if(itemInChest.isEmpty())
				throw new Exception("Target item with UUID "+targetItemUuid+ " does not exist in chest with UUID "+chestUuid );
			final GameItemRefEntity toRemove = itemInChest.get();
			success = targetChest.removeItem(targetItem);
			this.deleteGameItem(toRemove);
			targetChest.addItem(replacement);
		}
		this.playerAccountRepository.save(account);
		return success;
	}

	public void deleteGameItem(final GameItemRefEntity toDelete) {
		this.gameItemRefRepository.delete(toDelete);
	}

	public PlayerAccountDto getAccountById(final String accountId) throws Exception {
		final long start = Instant.now().toEpochMilli();
		Optional<PlayerAccountEntity> entity = this.playerAccountRepository.findById(accountId);
		if (entity.isPresent()) {
			PlayerDataService.log.info("Fetched account by id {} in {}ms", accountId,
					(Instant.now().toEpochMilli() - start));
			return this.mapper.map(entity, PlayerAccountDto.class);
		}
		throw new Exception("PlayerAccount with id "+ accountId+" not found");
	}

	public PlayerAccountDto getAccountByEmail(final String email) throws Exception {
		final long start = Instant.now().toEpochMilli();
		PlayerAccountEntity entity = this.playerAccountRepository.findByAccountEmail(email);
		if (entity != null) {
			PlayerDataService.log.info("Fetched account by email {} in {}ms", email,
					(Instant.now().toEpochMilli() - start));
			return this.mapper.map(entity, PlayerAccountDto.class);
		}
		throw new Exception("PlayerAccount with email "+ email+" not found");
	}

	public PlayerAccountDto getAccountByUuid(final String accountUuid) throws Exception {
		final long start = Instant.now().toEpochMilli();
		PlayerAccountEntity entity = this.playerAccountRepository.findByAccountUuid(accountUuid);
		if (entity != null) {
			PlayerDataService.log.info("Fetched account by UUID {} in {}ms", accountUuid,
					(Instant.now().toEpochMilli() - start));
			return this.mapper.map(entity, PlayerAccountDto.class);
		}
		throw new Exception("PlayerAccount with account UUID "+ accountUuid+" not found");
	}

	public static String randomUuid() {
		return UUID.randomUUID().toString();
	}
}
