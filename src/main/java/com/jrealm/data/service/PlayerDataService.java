package com.jrealm.data.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
import com.jrealm.data.repository.CharacterStatsRepository;
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
	private final transient CharacterStatsRepository playerStatsRepository;
	private final transient GameItemRefRepository gameItemRefRepository;
	private final transient ModelMapper mapper;

	public PlayerDataService(@Autowired final AccountRepository accountRepository,
			@Autowired final PlayerAccountRepository playerAccountRepository,
			@Autowired final ChestRepository playerChestRepository,
			@Autowired final CharacterRepository playerCharacterRepository,
			@Autowired final CharacterStatsRepository playerStatsRepository,
			@Autowired final GameItemRefRepository gameItemRefRepository, @Autowired final ModelMapper mapper) {
		this.accountRepository = accountRepository;
		this.playerAccountRepository = playerAccountRepository;
		this.playerChestRepository = playerChestRepository;
		this.playerCharacterRepository = playerCharacterRepository;
		this.playerStatsRepository = playerStatsRepository;
		this.gameItemRefRepository = gameItemRefRepository;
		this.mapper = mapper;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Order(2)
	public void seedAccounts() {
		try {

			if (this.playerAccountRepository.count() == 0L) {
				for(AccountEntity account : this.accountRepository.findAll()) {
					this.createInitialAccount(account.getAccountGuid(), account.getEmail(), "ruusey", CharacterClass.ROGUE.classId);
				}
			}
		} catch (Exception e) {
			PlayerDataService.log.error("Failed to seed Player Account. Reason: {}", e);
		}
	}

	public CharacterDto saveCharacterStats(final String characterUuid, final CharacterDto newData) throws Exception{
		CharacterEntity character = this.playerCharacterRepository.findByCharacterUuid(characterUuid);
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
		Set<Integer> itemsToHardDelete = new HashSet<>();
		for(GameItemRefEntity gameItem : character.getItems()) {
			itemsToHardDelete.add(gameItem.getGameItemRefId());
			// this.deleteGameItem(gameItem);
		}
		character.removeItems();

		for(GameItemRefDto item: newData.getItems()) {
			if(item==null) {
				continue;
			}
			GameItemRefEntity itemEntity = this.mapper.map(item, GameItemRefEntity.class);
			itemEntity = this.gameItemRefRepository.save(itemEntity);
			character.addItem(itemEntity);
		}

		character = this.playerCharacterRepository.save(character);
		this.hardDeleteItems(itemsToHardDelete);
		return this.mapper.map(character, CharacterDto.class);
	}

	public void hardDeleteItems(Set<Integer> itemIds) {
		for (final Integer itemId : itemIds) {
			this.gameItemRefRepository.delete(itemId);
		}
	}

	public Set<CharacterDto> getPlayerCharacters(final String accountUuid) throws Exception{
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

	public boolean replaceChestItem(final String chestUuid, final String targetItemUuid, final GameItemRefEntity replacement) throws Exception{
		final ChestEntity targetChest = this.playerChestRepository.findByChestUuid(chestUuid);
		boolean success = false;
		if(targetChest==null)
			throw new Exception("Chest with UUID "+chestUuid+" does not exist");
		final PlayerAccountEntity ownerAccount = targetChest.getOwnerAccount();
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
		if(toDelete==null)
			throw new Exception("GameItem with UUID "+ gameItemUuid+ " does not exist");
		this.gameItemRefRepository.delete(toDelete.getItemUuid());
	}

	public PlayerAccountDto getAccountById(final Integer accountId) throws Exception {
		Optional<PlayerAccountEntity> entity = this.playerAccountRepository.findById(accountId);
		if(entity.isPresent())
			return this.mapper.map(entity.get(), PlayerAccountDto.class);
		throw new Exception("PlayerAccount with id "+ accountId+" not found");
	}

	public PlayerAccountDto getAccountByEmail(final String email) throws Exception {
		Optional<PlayerAccountEntity> entity = this.playerAccountRepository.findByAccountEmail(email);
		if(entity.isPresent())
			return this.mapper.map(entity.get(), PlayerAccountDto.class);
		throw new Exception("PlayerAccount with email "+ email+" not found");
	}

	public PlayerAccountDto getAccountByUuid(final String accountUuid) throws Exception {
		Optional<PlayerAccountEntity> entity = this.playerAccountRepository.findByAccountUuid(accountUuid);
		if(entity.isPresent())
			return this.mapper.map(entity.get(), PlayerAccountDto.class);
		throw new Exception("PlayerAccount with account UUID "+ accountUuid+" not found");
	}

	//	private GameItemRefEntity newGameItem(final int gameItemId) throws Exception{
	//		GameItem model = GameDataManager.GAME_ITEMS.get(gameItemId);
	//		if(model == null) {
	//			throw new IllegalArgumentException("GameItem with id "+gameItemId+" does not exist.");
	//		}
	//		return GameItemRefEntity.builder().itemId(49).itemUuid(randomUuid()).build();
	//	}
	//
	//	private ChestEntity newChest(final int ordinal) {
	//		return ChestEntity.builder().ordinal(ordinal).build();
	//	}
	//
	//	private CharacterEntity newCharacter(final int characterClassId) {
	//		return CharacterEntity.builder().characterClass(characterClassId).build();
	//	}
	//
	//	private PlayerAccountEntity newPlayerAccount(final String email, final String accountName) {
	//		return PlayerAccountEntity.builder().accountEmail(email).accountName(accountName)
	//				.accountUuid(PlayerDataService.randomUuid()).build();
	//	}

	public static String randomUuid() {
		return UUID.randomUUID().toString();
	}
}
