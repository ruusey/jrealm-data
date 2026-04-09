package com.jrealm.data.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import com.jrealm.data.auth.PlayerIdentityFilter;
import com.jrealm.data.dto.auth.AccountDto;
import com.jrealm.data.dto.auth.AccountProvision;
import com.jrealm.data.dto.CharacterDto;
import com.jrealm.data.dto.CharacterStatsDto;
import com.jrealm.data.dto.LeaderboardEntryDto;
import com.jrealm.data.dto.ChestDto;
import com.jrealm.data.dto.GameItemRefDto;
import com.jrealm.data.dto.PlayerAccountDto;
import com.jrealm.data.entity.CharacterEntity;
import com.jrealm.data.entity.CharacterStatsEntity;
import com.jrealm.data.entity.ChestEntity;
import com.jrealm.data.entity.GameItemRefEntity;
import com.jrealm.data.entity.PlayerAccountEntity;
import com.jrealm.data.entity.auth.AccountEntity;
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
    private final transient GameItemRefRepository gameItemRefRepository;
    private final transient PlayerIdentityFilter authFilter;
    private final transient AccountService accountService;
    private final transient ModelMapper mapper;

    public PlayerDataService(@Autowired final AccountRepository accountRepository,
            @Autowired final PlayerAccountRepository playerAccountRepository,
            @Autowired final ChestRepository playerChestRepository,
            @Autowired final GameItemRefRepository gameItemRefRepository,
            @Autowired final PlayerIdentityFilter authFilter,
            @Autowired final AccountService accountService,
            @Autowired final ModelMapper mapper) {
        this.accountRepository = accountRepository;
        this.playerAccountRepository = playerAccountRepository;
        this.playerChestRepository = playerChestRepository;
        this.gameItemRefRepository = gameItemRefRepository;
        this.authFilter = authFilter;
        this.accountService = accountService;
        this.mapper = mapper;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(2)
    public void seedAccounts() {
        try {

            if (this.playerAccountRepository.count() == 0L) {
                for (AccountEntity account : this.accountRepository.findAll()) {
                    this.createInitialAccount(account.getAccountGuid(), account.getEmail(), account.getAccountName(),
                            CharacterClass.WIZARD.classId);
                }
            }
        } catch (Exception e) {
            PlayerDataService.log.error("Failed to seed Player Account. Reason: {}", e);
        }
    }

    public CharacterDto saveCharacterStats(final HttpServletRequest request, final String characterUuid, final CharacterDto newData) throws Exception {
        final long start = Instant.now().toEpochMilli();
        PlayerAccountEntity ownerAccount = this.playerAccountRepository.findByCharactersCharacterUuid(characterUuid);
        if (!this.authFilter.accountGuidMatch(ownerAccount.getAccountUuid(), request)) {
            throw new Exception("Invalid token");
        }
        final CharacterEntity character = ownerAccount.findCharacterByUuid(characterUuid);
        if (character == null)
            throw new Exception("Character with UUID " + characterUuid + " was not found.");

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

        for (GameItemRefDto item : newData.getItems()) {
            if (item == null) {
                continue;
            }
            GameItemRefEntity itemEntity = this.mapper.map(item, GameItemRefEntity.class);
            character.addItem(itemEntity);
        }

        ownerAccount = this.playerAccountRepository.save(ownerAccount);
        PlayerDataService.log.debug("Successfully saved character stats for character {} in {}ms",
                character.getCharacterUuid(), (Instant.now().toEpochMilli() - start));
        return this.mapper.map(character, CharacterDto.class);
    }
    
    public List<LeaderboardEntryDto> getTopCharacters(int count) {
        final List<LeaderboardEntryDto> results = new ArrayList<>();
        final List<PlayerAccountEntity> accounts = this.playerAccountRepository.findAll();

        // Flatten all characters with their account name, sort by XP descending
        final List<Map.Entry<String, CharacterEntity>> ranked = new ArrayList<>();
        for (PlayerAccountEntity acc : accounts) {
            if (acc.getCharacters() == null) continue;
            for (CharacterEntity ch : acc.getCharacters()) {
                if (ch.getDeleted() != null) continue; // exclude dead characters
                if (ch.getStats() == null || ch.getStats().getXp() == null) continue;
                ranked.add(Map.entry(acc.getAccountName() != null ? acc.getAccountName() : "Unknown", ch));
            }
        }
        ranked.sort((a, b) -> Long.compare(
                b.getValue().getStats().getXp(),
                a.getValue().getStats().getXp()));

        final int limit = Math.min(count, ranked.size());
        for (int i = 0; i < limit; i++) {
            final Map.Entry<String, CharacterEntity> entry = ranked.get(i);
            final CharacterEntity ch = entry.getValue();
            final CharacterStatsDto statsDto = this.mapper.map(ch.getStats(), CharacterStatsDto.class);
            final Integer classId = ch.getStats().getClassId() != null ? ch.getStats().getClassId() : ch.getCharacterClass();

            // Resolve level and class name from game data
            int level = 1;
            long fame = 0;
            String className = "Unknown";
            if (GameDataManager.EXPERIENCE_LVLS != null && statsDto.getXp() != null) {
                level = GameDataManager.EXPERIENCE_LVLS.getLevel(statsDto.getXp());
                fame = GameDataManager.EXPERIENCE_LVLS.getBaseFame(statsDto.getXp());
            }
            if (GameDataManager.CHARACTER_CLASSES != null && classId != null) {
                final com.jrealm.game.model.CharacterClassModel model = GameDataManager.CHARACTER_CLASSES.get(classId);
                if (model != null) className = model.getClassName();
            }

            // Map equipment items (slots 0-3)
            final List<GameItemRefDto> equipment = new ArrayList<>();
            if (ch.getItems() != null) {
                for (com.jrealm.data.entity.GameItemRefEntity item : ch.getItems()) {
                    if (item.getSlotIdx() != null && item.getSlotIdx() < 4) {
                        equipment.add(this.mapper.map(item, GameItemRefDto.class));
                    }
                }
            }

            results.add(LeaderboardEntryDto.builder()
                    .accountName(entry.getKey())
                    .characterUuid(ch.getCharacterUuid())
                    .characterClass(classId)
                    .className(className)
                    .level(level)
                    .fame(fame)
                    .equipment(equipment)
                    .stats(statsDto)
                    .build());
        }
        return results;
    }

    private static final int MAX_CHARACTERS = 20;
    private static final int MAX_CHARACTERS_DEMO = 1;
    private static final int MAX_CHESTS = 10;
    private static final int MAX_CHESTS_DEMO = 1;

    public PlayerAccountDto createCharacter(final String accountUuid, final Integer classId) throws Exception {
        final long start = Instant.now().toEpochMilli();
        final CharacterClass clazz = CharacterClass.valueOf(classId);
        if (clazz == null)
            throw new Exception("Character class with id " + classId + " does not exist");
        PlayerAccountEntity accountEntity = this.playerAccountRepository.findByAccountUuid(accountUuid);
        if (accountEntity == null)
            throw new Exception("Account with with UUID " + accountUuid + " does not exist");
        // Check demo account character limit
        final boolean isDemoAccount = this.isAccountDemo(accountUuid);
        final int charLimit = isDemoAccount ? MAX_CHARACTERS_DEMO : MAX_CHARACTERS;
        if (accountEntity.getCharacters() != null && accountEntity.getCharacters().size() >= charLimit)
            throw new Exception("Character limit reached (" + charLimit + " max)");
        final CharacterEntity character = CharacterEntity.builder().characterUuid(PlayerDataService.randomUuid())
                .characterClass(classId).build();

        // Equip the player with their starting equipment
        final Map<Integer, GameItem> startingEquip = GameDataManager.getStartingEquipment(clazz);
        if (startingEquip != null) {
            for (Map.Entry<Integer, GameItem> entry : startingEquip.entrySet()) {
                if (entry.getValue() != null) {
                    final GameItemRefEntity toEquipEntity = GameItemRefEntity.from(entry.getKey(), entry.getValue().getItemId());
                    character.addItem(toEquipEntity);
                }
            }
        }

        final CharacterStatsEntity characterStats = CharacterStatsEntity.characterDefaults(classId);
        character.setStats(characterStats);

        accountEntity.addCharacter(character);

        accountEntity = this.playerAccountRepository.save(accountEntity);
        PlayerDataService.log.info("Successfully created character for account {} in {}ms", accountUuid,
                (Instant.now().toEpochMilli() - start));

        return this.mapper.map(accountEntity, PlayerAccountDto.class);
    }

    public void deleteCharacter(final HttpServletRequest request, final String characterUuid) throws Exception {
        final long start = Instant.now().toEpochMilli();
        final PlayerAccountEntity account = this.playerAccountRepository.findByCharactersCharacterUuid(characterUuid);
        if (!this.authFilter.accountGuidMatch(account.getAccountUuid(), request)) {
            throw new Exception("Invalid token");
        }
        final Optional<CharacterEntity> characterToDelete = account.getCharacters().stream()
                .filter(character -> character.getCharacterUuid().equals(characterUuid)).findAny();
        if (characterToDelete.isEmpty())
            throw new Exception("Player character with UUID " + characterUuid + " does not exist");
        characterToDelete.get().setDeleted(new Date(Instant.now().toEpochMilli()));
        PlayerDataService.log.info("Successfully deleted character {} in {}ms", characterUuid,
                (Instant.now().toEpochMilli() - start));
        this.playerAccountRepository.save(account);
    }
    
    public List<PlayerAccountDto> getAllAccounts(){
        final List<PlayerAccountDto> results = new ArrayList<>();
        for(PlayerAccountEntity account : this.playerAccountRepository.findAll()) {
            PlayerAccountDto playerAccount = null;
            try {
                playerAccount = this.getAccountByUuid(account.getAccountUuid());
            } catch (Exception e) {
               log.error("Failed to fetch player account. Reason: {}", e);
            }
            results.add(playerAccount);
        }
      
        return results;
    }

    public List<CharacterDto> getPlayerCharacters(final String accountUuid) throws Exception {
        final PlayerAccountDto account = this.getAccountByUuid(accountUuid);
        if (account == null)
            throw new Exception("Player account with UUID " + accountUuid + " was not found");
        return account.getCharacters();
    }

    public PlayerAccountDto createChest(final String accountUuid) throws Exception {
        final PlayerAccountDto account = this.getAccountByUuid(accountUuid);
        if (account == null)
            throw new Exception("Player account with UUID " + accountUuid + " was not found");
        final boolean isDemoAccount = this.isAccountDemo(accountUuid);
        final int chestLimit = isDemoAccount ? MAX_CHESTS_DEMO : MAX_CHESTS;
        if (account.getPlayerVault() != null && account.getPlayerVault().size() >= chestLimit)
            throw new Exception("Vault chest limit reached (" + chestLimit + " max)");

        final ChestDto initialChest = ChestDto.builder().chestUuid(PlayerDataService.randomUuid())
                .ordinal(account.getPlayerVault() != null ? account.getPlayerVault().size() : 0).build();

        account.getPlayerVault().add(initialChest);
        return this.saveAccount(account);
    }

    public PlayerAccountDto saveChests(final String accountUuid, final List<ChestDto> chests) throws Exception {
        final PlayerAccountDto account = this.getAccountByUuid(accountUuid);
        if (account == null)
            throw new Exception("Player account with UUID " + accountUuid + " was not found");

        account.setPlayerVault(chests);
        return this.saveAccount(account);
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
        final ChestEntity initialChest = ChestEntity.builder().chestUuid(PlayerDataService.randomUuid()).ordinal(0)
                .build();
        // Create a new GameItemRef and put it in this chest

        final GameItemRefEntity gameItemDBow = GameItemRefEntity.from(0, 47);
        // Add the item to the chest
        initialChest.addItem(gameItemDBow);

        // Build a character from the provided classId, give it a weapon and give it
        // default stats from GameDataManager
        final CharacterEntity character = CharacterEntity.builder().characterUuid(PlayerDataService.randomUuid())
                .characterClass(characterClass).build();

        // Equip the player with their starting equipment
        final CharacterClass clazz = CharacterClass.valueOf(characterClass);
        if (clazz != null) {
            final Map<Integer, GameItem> startingEquip = GameDataManager.getStartingEquipment(clazz);
            if (startingEquip != null) {
                for (Map.Entry<Integer, GameItem> entry : startingEquip.entrySet()) {
                    if (entry.getValue() != null) {
                        final GameItemRefEntity toEquipEntity = GameItemRefEntity.from(entry.getKey(), entry.getValue().getItemId());
                        character.addItem(toEquipEntity);
                    }
                }
            }
        }

        final CharacterStatsEntity characterStats = CharacterStatsEntity.characterDefaults(characterClass);
        character.setStats(characterStats);

        account.addCharacter(character);
        account.addChest(initialChest);

        final PlayerAccountEntity finalAccount = this.playerAccountRepository.save(account);

        // this.replaceChestItem(initialChest.getChestUuid(),
        // gameItemDBow.getItemUuid(), null);
        PlayerDataService.log.info("Successfully created account for user {} in {}ms", finalAccount.getAccountEmail(),
                (Instant.now().toEpochMilli() - start));
        return this.mapper.map(finalAccount, PlayerAccountDto.class);
    }

    /**
     * Create a player account entry with no characters and no chests (for guest/demo accounts).
     */
    public PlayerAccountDto createEmptyAccount(final String accountUuid, final String email, final String accountName)
            throws Exception {
        final long start = Instant.now().toEpochMilli();
        final PlayerAccountEntity account = PlayerAccountEntity.builder().accountEmail(email).accountName(accountName)
                .accountUuid(accountUuid).build();
        final PlayerAccountEntity finalAccount = this.playerAccountRepository.save(account);
        PlayerDataService.log.info("Successfully created empty guest account for user {} in {}ms",
                finalAccount.getAccountEmail(), (Instant.now().toEpochMilli() - start));
        return this.mapper.map(finalAccount, PlayerAccountDto.class);
    }

    /**
     * Check if the given account has the OPENREALM_DEMO provision.
     */
    private boolean isAccountDemo(final String accountUuid) {
        try {
            final AccountDto authAccount = this.accountService.getAccountByGuid(accountUuid);
            return authAccount != null && authAccount.isDemo();
        } catch (Exception e) {
            PlayerDataService.log.warn("Could not check demo status for account {}: {}", accountUuid, e.getMessage());
            return false;
        }
    }

    public boolean replaceChestItem(final String accountUuid, final String chestUuid, final String targetItemUuid,
            final GameItemRefEntity replacement) throws Exception {
        final PlayerAccountEntity account = this.playerAccountRepository.findByAccountUuid(accountUuid);
        final ChestEntity targetChest = this.playerChestRepository.findByChestUuid(chestUuid);
        boolean success = false;
        if (targetChest == null)
            throw new Exception("Chest with UUID " + chestUuid + " does not exist");
        final GameItemRefEntity targetItem = this.gameItemRefRepository.findByItemUuid(targetItemUuid);
        if (targetItem == null)
            throw new Exception("Target item with UUID " + targetItemUuid + " does not exist");
        if (replacement == null) {
            final Optional<GameItemRefEntity> itemInChest = targetChest.getItems().stream()
                    .filter(item -> item.getItemUuid().equals(targetItemUuid)).findAny();
            if (itemInChest.isEmpty())
                throw new Exception(
                        "Target item with UUID " + targetItemUuid + " does not exist in chest with UUID " + chestUuid);
            final GameItemRefEntity toRemove = itemInChest.get();
            success = targetChest.removeItem(targetItem);
            this.deleteGameItem(toRemove);
        } else {
            final Optional<GameItemRefEntity> itemInChest = targetChest.getItems().stream()
                    .filter(item -> item.getItemUuid().equals(targetItemUuid)).findAny();
            if (itemInChest.isEmpty())
                throw new Exception(
                        "Target item with UUID " + targetItemUuid + " does not exist in chest with UUID " + chestUuid);
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
        final Optional<PlayerAccountEntity> entity = this.playerAccountRepository.findById(accountId);
        if (entity.isPresent()) {
            PlayerDataService.log.debug("Fetched account by id {} in {}ms", accountId,
                    (Instant.now().toEpochMilli() - start));
            return this.mapper.map(entity, PlayerAccountDto.class);
        }
        throw new Exception("PlayerAccount with id " + accountId + " not found");
    }

    public PlayerAccountDto getAccountByEmail(final String email) throws Exception {
        final long start = Instant.now().toEpochMilli();
        final PlayerAccountEntity entity = this.playerAccountRepository.findByAccountEmail(email);
        if (entity != null) {
            PlayerDataService.log.info("Fetched account by email {} in {}ms", email,
                    (Instant.now().toEpochMilli() - start));
            return this.mapper.map(entity, PlayerAccountDto.class);
        }
        throw new Exception("PlayerAccount with email " + email + " not found");
    }

    public PlayerAccountDto getAccountByUuid(final String accountUuid) throws Exception {
        final long start = Instant.now().toEpochMilli();
        final PlayerAccountEntity entity = this.playerAccountRepository.findByAccountUuid(accountUuid);
        if (entity != null) {
            PlayerDataService.log.debug("Fetched account by UUID {} in {}ms", accountUuid,
                    (Instant.now().toEpochMilli() - start));
            return this.mapper.map(entity, PlayerAccountDto.class);
        }
        throw new Exception("PlayerAccount with account UUID " + accountUuid + " not found");
    }

    public static String randomUuid() {
        return UUID.randomUUID().toString();
    }
}
