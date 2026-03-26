// JRealm Web Client - Main Entry Point

import { ApiClient } from './api.js';
import { GameNetwork } from './network.js';
import { GameState, CLASS_NAMES } from './game.js';
import { GameRenderer } from './renderer.js';
import { InputHandler } from './input.js';
import { PacketId, PacketWriters } from './codec.js';
import { initTradeUI, updateNearbyPlayers } from './trade.js';

// --- App State ---
const api = new ApiClient();
const network = new GameNetwork();
const game = new GameState();
const input = new InputHandler();
let renderer = null;

let currentScreen = 'login';
let account = null;
let selectedCharacter = null;
let gameServerHost = 'localhost';
// Movement: track X and Y axes independently for diagonal support
// Server Cardinality: NORTH=0, SOUTH=1, EAST=2, WEST=3, NONE=4
let lastXDir = null; // null=none, 2=EAST, 3=WEST
let lastYDir = null; // null=none, 0=NORTH, 1=SOUTH
let shootCooldown = 0;
let projectileCounter = 0;

// --- Sprite sheets to load ---
// Must match Java GameSpriteManager.SPRITE_NAMES exactly
const SPRITE_SHEETS = [
    'lofi_classes.png', 'rotmg-projectiles.png',
    'rotmg-bosses-1.png', 'rotmg-bosses.png',
    'rotmg-items.png', 'rotmg-items-1.png',
    'rotmg-tiles.png', 'rotmg-tiles-1.png', 'rotmg-tiles-2.png',
    'rotmg-tiles-all.png', 'rotmg-tiles-1_0.png', 'rotmg-tiles-1_.png',
    'rotmg-abilities.png', 'rotmg-misc.png',
    'buttons.png', 'fillbars.png', 'icons.png', 'slots.png', 'ui.png',
    'rotmg-bosses-1_.png',
    'rotmg-classes-0.png', 'rotmg-classes-1.png', 'rotmg-classes-2.png', 'rotmg-classes-3.png',
    'lofi_char.png', 'lofi_environment.png', 'lofi_halls.png',
    'lofi_obj.png', 'lofi_obj_packA.png', 'lofi_obj_packB.png',
    'lofi_dungeon_features.png'
];

// --- Screen Management ---
function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${name}-screen`).classList.add('active');
    currentScreen = name;
}

// --- Login ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    gameServerHost = document.getElementById('server-addr').value || 'localhost';
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
        api.setDataServerUrl(gameServerHost);
        const loginData = await api.login(email, password);
        account = await api.getAccount(loginData.accountGuid);
        showCharacterSelect();
    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
    }
});

// --- Register ---
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
});
document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    gameServerHost = document.getElementById('reg-server').value || 'localhost';
    const errorEl = document.getElementById('register-error');
    const btn = document.getElementById('register-btn');

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Registering...';

    try {
        api.setDataServerUrl(gameServerHost);
        await api.register(email, password, name);
        // Auto-login after registration
        const loginData = await api.login(email, password);
        account = await api.getAccount(loginData.accountGuid);
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        showCharacterSelect();
    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Register';
    }
});

// --- Character Select & Management ---
const ALL_CLASSES = [
    'Rogue', 'Archer', 'Wizard', 'Priest', 'Warrior', 'Knight',
    'Paladin', 'Assassin', 'Necromancer', 'Mystic', 'Trickster', 'Sorcerer'
];
let selectedClassId = null;

function showCharacterSelect() {
    showScreen('charselect');
    selectedCharacter = null;
    selectedClassId = null;
    document.getElementById('play-btn').disabled = true;
    document.getElementById('delete-char-btn').disabled = true;
    document.getElementById('create-char-btn').disabled = true;
    document.getElementById('char-error').textContent = '';

    // Character list
    const listEl = document.getElementById('char-list');
    listEl.innerHTML = '';
    if (!account.characters || account.characters.length === 0) {
        listEl.innerHTML = '<p style="color:#887868">No characters yet. Create one below!</p>';
    } else {
        for (const char of account.characters) {
            const card = document.createElement('div');
            card.className = 'char-card';
            const className = ALL_CLASSES[char.characterClass] || `Class ${char.characterClass}`;
            const stats = char.stats || {};
            card.innerHTML = `
                <div class="char-icon">${className.charAt(0)}</div>
                <div class="char-info">
                    <div class="char-name">${className}</div>
                    <div class="char-details">
                        HP: ${stats.hp || '?'} | MP: ${stats.mp || '?'} |
                        ATT: ${stats.att || '?'} | DEF: ${stats.def || '?'} |
                        SPD: ${stats.spd || '?'} | DEX: ${stats.dex || '?'}
                    </div>
                    <div class="char-details" style="font-size:10px;color:#665848">${char.characterUuid}</div>
                </div>
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedCharacter = char;
                document.getElementById('play-btn').disabled = false;
                document.getElementById('delete-char-btn').disabled = false;
            });
            listEl.appendChild(card);
        }
    }

    // Class picker for creating new characters
    const pickerEl = document.getElementById('class-picker');
    pickerEl.innerHTML = '';
    for (let i = 0; i < ALL_CLASSES.length; i++) {
        const opt = document.createElement('div');
        opt.className = 'class-option';
        opt.textContent = ALL_CLASSES[i];
        opt.addEventListener('click', () => {
            document.querySelectorAll('.class-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedClassId = i;
            document.getElementById('create-char-btn').disabled = false;
        });
        pickerEl.appendChild(opt);
    }

    // Vault chest count
    const chestCount = account.playerVault ? account.playerVault.length : 0;
    document.getElementById('chest-count').textContent = `Vault Chests: ${chestCount}/10`;
}

document.getElementById('play-btn').addEventListener('click', () => {
    if (selectedCharacter) startGame();
});

document.getElementById('delete-char-btn').addEventListener('click', async () => {
    if (!selectedCharacter) return;
    const className = ALL_CLASSES[selectedCharacter.characterClass] || 'Character';
    if (!confirm(`Delete ${className}? This is permanent!`)) return;

    const errorEl = document.getElementById('char-error');
    try {
        await api.deleteCharacter(selectedCharacter.characterUuid);
        account = await api.getAccount(api.accountGuid);
        selectedCharacter = null;
        showCharacterSelect();
    } catch (err) {
        errorEl.textContent = err.message;
    }
});

document.getElementById('create-char-btn').addEventListener('click', async () => {
    if (selectedClassId === null) return;
    const errorEl = document.getElementById('char-error');
    const charCount = account.characters ? account.characters.length : 0;
    if (charCount >= 20) {
        errorEl.textContent = 'Character limit reached (20 max).';
        return;
    }
    const btn = document.getElementById('create-char-btn');
    btn.disabled = true;
    btn.textContent = 'Creating...';
    try {
        await api.createCharacter(api.accountGuid, selectedClassId);
        account = await api.getAccount(api.accountGuid);
        showCharacterSelect();
    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create';
    }
});

document.getElementById('add-chest-btn').addEventListener('click', async () => {
    const errorEl = document.getElementById('char-error');
    const chestCount = account.playerVault ? account.playerVault.length : 0;
    if (chestCount >= 10) {
        errorEl.textContent = 'Vault chest limit reached (10 max).';
        return;
    }
    try {
        await api.createChest(api.accountGuid);
        account = await api.getAccount(api.accountGuid);
        const newCount = account.playerVault ? account.playerVault.length : 0;
        document.getElementById('chest-count').textContent = `Vault Chests: ${newCount}/10`;
    } catch (err) {
        errorEl.textContent = err.message;
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    network.disconnect();
    account = null;
    selectedCharacter = null;
    showScreen('login');
});

// --- Player Death ---
// Matches Java: GAME_OVER flag, send DeathAck, disconnect, show death screen
function handlePlayerDeath() {
    console.log('[GAME] Player died!');

    // Send DeathAckPacket to server
    network.send(PacketWriters.deathAck(game.playerId));

    // Disconnect from game server
    network.disconnect();

    // Stop game loop from processing input/rendering
    game.playerId = null;

    // Show death overlay
    showDeathScreen();
}

function showDeathScreen() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'death-overlay';
    overlay.innerHTML = `
        <div class="death-content">
            <h1 class="death-title">GAME OVER</h1>
            <p class="death-subtitle">${game.playerName} has fallen.</p>
            <p class="death-info">Your character has been lost to the realm.</p>
            <button id="death-charselect-btn">Select Character</button>
            <button id="death-quit-btn" class="secondary">Quit</button>
        </div>
    `;
    document.getElementById('game-screen').appendChild(overlay);

    const doCharSelect = () => {
        const ol = document.getElementById('death-overlay');
        if (ol) ol.remove();
        game.fullReset();
        lastXDir = null; lastYDir = null;
        selectedSlot = -1;
        lastInvKey = ''; lastLootKey = '';
        updateInventoryUI._logged = false;
        if (renderer) { renderer.destroy(); renderer = null; }

        if (account && api.sessionToken) {
            api.getAccount(api.accountGuid).then(acc => {
                account = acc;
                showCharacterSelect();
            }).catch(() => showScreen('login'));
        } else {
            showScreen('login');
        }
    };

    const doQuit = () => {
        const ol = document.getElementById('death-overlay');
        if (ol) ol.remove();
        game.fullReset();
        if (renderer) { renderer.destroy(); renderer = null; }
        showScreen('login');
    };

    // Use onclick instead of addEventListener to avoid duplicate handler issues
    document.getElementById('death-charselect-btn').onclick = doCharSelect;
    document.getElementById('death-quit-btn').onclick = doQuit;
}

// Realm transition: matches Java PlayState portal handling
// 1. Send UsePortalPacket  2. Clear local state  3. Send LoginAckPacket
function doRealmTransition(portal, isVault) {
    console.log(`[REALM] Starting transition, vault=${isVault}, portal=${portal?.id}`);

    // Send UsePortalPacket matching Java factory methods exactly:
    // toVault(): portalId=-1, toVault=1, toNexus=-1
    // from():    portalId=id, toVault=-1, toNexus=-1
    // Server checks: isToVault() = toVault != -1, isToNexus() = toNexus != -1
    // So we MUST send -1 (not 0) for "false" flags!
    if (isVault) {
        // Prevent double vault entry
        if (game.mapId === 1) return;
        network.sendUsePortal(-1n, game.realmId || 0n, game.playerId, 1, -1);
    } else if (portal) {
        network.sendUsePortal(portal.id, game.realmId || 0n, game.playerId, -1, -1);
    }

    // Clear local state (matches Java Realm.loadMap)
    game.prepareRealmTransition();

    // Reset renderer tile debug flag so new tiles get logged
    if (renderer) {
        renderer._tileDebugLogged = false;
        renderer._debugLogged = false;
    }

    // Reset movement state
    lastXDir = null; lastYDir = null;
    lastInvKey = ''; lastLootKey = '';

    // Tell server we're ready for new tiles (triggers sendImmediateLoadMap)
    network.sendLoginAck(game.playerId);
}

function returnToCharacterSelect() {
    network.disconnect();
    game.fullReset();
    lastXDir = null; lastYDir = null;
    selectedSlot = -1;
    lastInvKey = ''; lastLootKey = '';
    updateInventoryUI._logged = false;

    // Destroy renderer
    if (renderer) {
        renderer.destroy();
        renderer = null;
    }

    // Refresh account data and show character select
    if (account && api.sessionToken) {
        api.getAccount(api.accountGuid).then(acc => {
            account = acc;
            showCharacterSelect();
        }).catch(() => showCharacterSelect());
    } else {
        showCharacterSelect();
    }
}

// --- Game Start ---
async function startGame() {
    showScreen('game');
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = 'Loading assets...';
    statusEl.className = '';

    // Init renderer
    const container = document.getElementById('game-canvas-container');
    renderer = new GameRenderer(container);
    await renderer.init();

    // Load game data
    try {
        const [tileData, enemyData, itemData, charClasses, portalData, projGroups, expLevels, mapData] = await Promise.all([
            api.getGameData('tiles.json'),
            api.getGameData('enemies.json'),
            api.getGameData('game-items.json'),
            api.getGameData('character-classes.json'),
            api.getGameData('portals.json'),
            api.getGameData('projectile-groups.json'),
            api.getGameData('exp-levels.json'),
            api.getGameData('maps.json')
        ]);

        // Index by ID
        if (Array.isArray(tileData)) tileData.forEach(t => game.tileData[t.tileId] = t);
        else game.tileData = tileData;

        if (Array.isArray(enemyData)) enemyData.forEach(e => game.enemyData[e.enemyId] = e);
        else game.enemyData = enemyData;

        if (Array.isArray(itemData)) itemData.forEach(i => game.itemData[i.itemId] = i);
        else game.itemData = itemData;

        if (Array.isArray(charClasses)) charClasses.forEach(c => game.characterClasses[c.classId] = c);
        else game.characterClasses = charClasses;

        if (Array.isArray(portalData)) portalData.forEach(p => game.portalData[p.portalId] = p);
        else game.portalData = portalData;

        if (Array.isArray(projGroups)) projGroups.forEach(p => game.projectileGroups[p.projectileGroupId] = p);
        else game.projectileGroups = projGroups;

        game.expLevels = expLevels;

        // Store map data in renderer for tile size lookups
        renderer.setMapData(mapData);
    } catch (e) {
        console.error('Failed to load game data:', e);
    }

    // Load sprite sheets
    statusEl.textContent = 'Loading sprites...';
    for (const sheet of SPRITE_SHEETS) {
        const key = sheet.replace('.png', '');
        await renderer.loadTexture(key, api.getSpriteUrl(sheet));
    }

    // Build tile textures from definitions
    renderer.buildTileTextures(game.tileData);

    // Connect to game server
    statusEl.textContent = 'Connecting to game server...';
    setupNetworkHandlers();

    network.onConnect = () => {
        statusEl.textContent = 'Logging in...';
        statusEl.className = '';
        // Send login command
        network.sendLogin(
            selectedCharacter.characterUuid,
            document.getElementById('email').value,
            document.getElementById('password').value
        );
    };

    network.onDisconnect = () => {
        statusEl.textContent = 'Disconnected';
        statusEl.className = 'error';
    };

    network.connect(gameServerHost);

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// --- Network Handlers ---
function setupNetworkHandlers() {
    network.on(PacketId.COMMAND, (data) => {
        // commandId 2 = LOGIN_RESPONSE
        if (data.commandId === 2) {
            try {
                const loginResp = JSON.parse(data.command);
                if (loginResp.success) {
                    // Use playerId from binary CommandPacket (exact BigInt),
                    // NOT from JSON (loses precision for int64 > 2^53)
                    game.playerId = data.playerId;
                    game.classId = loginResp.classId;
                    game.cameraX = loginResp.spawnX;
                    game.cameraY = loginResp.spawnY;
                    console.log(`[LOGIN] playerId=${game.playerId} (type=${typeof game.playerId}), ` +
                        `classId=${game.classId}, spawn=(${game.cameraX}, ${game.cameraY})`);

                    // Create local player entity
                    game.players.set(game.playerId, {
                        id: game.playerId,
                        name: account.accountName || 'Player',
                        classId: loginResp.classId,
                        pos: { x: loginResp.spawnX, y: loginResp.spawnY },
                        targetX: loginResp.spawnX,
                        targetY: loginResp.spawnY,
                        dx: 0, dy: 0,
                        size: 32,
                        animFrame: 0, animTimer: 0, facing: 'right'
                    });

                    // Initialize inventory from login account data
                    // (don't wait for first UpdatePacket which may be delayed)
                    if (loginResp.account && loginResp.account.characters) {
                        const myChar = loginResp.account.characters.find(
                            c => c.characterUuid === selectedCharacter.characterUuid
                        );
                        if (myChar && myChar.items) {
                            // Build inventory array from GameItemRefDto set
                            const inv = new Array(20).fill(null);
                            for (const ref of myChar.items) {
                                if (ref.slotIdx >= 0 && ref.slotIdx < 20) {
                                    const itemDef = game.itemData[ref.itemId];
                                    if (itemDef) {
                                        inv[ref.slotIdx] = { ...itemDef, uid: ref.itemUuid || '' };
                                    }
                                }
                            }
                            game.inventory = inv;
                            lastInvKey = '';
                        }
                    }

                    // Send login ack and start heartbeat
                    network.sendLoginAck(game.playerId);
                    network.startHeartbeat(game.playerId);

                    const statusEl = document.getElementById('connection-status');
                    statusEl.textContent = 'Connected';
                    statusEl.className = 'connected';

                    addChatMessage('SYSTEM', `Welcome to JRealm! Playing as ${CLASS_NAMES[loginResp.classId]}`);
                } else {
                    const statusEl = document.getElementById('connection-status');
                    statusEl.textContent = 'Login failed';
                    statusEl.className = 'error';
                }
            } catch (e) {
                console.error('Failed to parse login response:', e);
            }
        }
        // commandId 4 = SERVER_ERROR
        else if (data.commandId === 4) {
            try {
                const err = JSON.parse(data.command);
                addChatMessage('SYSTEM', `Error: ${err.message}`);
            } catch (e) {}
        }
        // commandId 5 = PLAYER_ACCOUNT
        else if (data.commandId === 5) {
            try {
                const accMsg = JSON.parse(data.command);
                if (accMsg.account) account = accMsg.account;
            } catch (e) {}
        }
    });

    network.on(PacketId.LOAD_MAP, (data) => {
        console.log(`[GAME] LoadMap: realmId=${data.realmId}, mapId=${data.mapId}, ` +
            `size=${data.mapWidth}x${data.mapHeight}, tiles=${data.tiles.length}`);
        game.handleLoadMap(data);
        // Update tile size from map definitions
        if (renderer) {
            renderer.updateTileSize(data.mapId);
            renderer._tileDebugLogged = false; // Re-log after map change
        }
    });
    network.on(PacketId.LOAD, (data) => {
        game.handleLoad(data);
        // Force loot UI refresh when containers change
        if (data.containers.length > 0) {
            lastLootKey = '';
            for (const c of data.containers) {
                const itemIds = c.items.map(i => i ? i.itemId : -1);
                console.log(`[LOOT] Container ${c.lootContainerId} tier=${c.tier} changed=${c.contentsChanged} items=[${itemIds}] pos=(${c.pos.x},${c.pos.y})`);
            }
        }
    });
    network.on(PacketId.UNLOAD, (data) => {
        game.handleUnload(data);
        if (data.containers.length > 0) { lastLootKey = ''; }
    });
    network.on(PacketId.OBJECT_MOVE, (data) => game.handleObjectMove(data));
    network.on(PacketId.UPDATE, (data) => {
        game.handleUpdate(data);
        // Force inv refresh when our inventory updates
        if (data.playerId === game.playerId) { lastInvKey = ''; lastLootKey = ''; }
    });

    network.on(PacketId.TEXT, (data) => {
        game.handleText(data);
        addChatMessage(data.from, data.message);
    });

    network.on(PacketId.TEXT_EFFECT, (data) => {
        game.handleTextEffect(data);
    });

    network.on(PacketId.PLAYER_DEATH, (data) => {
        if (data.playerId === game.playerId) {
            handlePlayerDeath();
        }
    });

    network.on(PacketId.CREATE_EFFECT, (data) => {
        // Status effect applied to entity - tracked via UpdatePacket effectIds
    });

    // Trading handlers managed by trade.js module
    initTradeUI(game, network, addChatMessage);
}

// --- Game Loop ---
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // Cap delta at 100ms
    lastTime = timestamp;

    if (currentScreen === 'game' && game.playerId !== null) {
        // Process input
        processInput(dt);

        // Update interpolation
        game.updateInterpolation(dt);

        // Render
        if (renderer) {
            renderer.render(game);
        }

        // Update HUD
        updateHUD();
    }

    requestAnimationFrame(gameLoop);
}

// --- Input Processing ---
function processInput(dt) {
    // Determine current X and Y axis directions from held keys
    let xDir = null;
    let yDir = null;
    if (!input.chatMode) {
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) xDir = 2; // EAST
        else if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) xDir = 3; // WEST

        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) yDir = 0; // NORTH
        else if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) yDir = 1; // SOUTH
    }

    // --- Send direction packets to server only on change ---
    if (xDir !== lastXDir || yDir !== lastYDir) {
        const wasMoving = lastXDir !== null || lastYDir !== null;
        const isMoving = xDir !== null || yDir !== null;

        if (!isMoving) {
            network.sendPlayerMove(game.playerId, 4, false); // NONE
        } else if (wasMoving && (
            (lastXDir !== null && xDir === null) ||
            (lastYDir !== null && yDir === null)
        )) {
            // Axis deactivated: reset both, re-send active
            network.sendPlayerMove(game.playerId, 4, false);
            if (yDir !== null) network.sendPlayerMove(game.playerId, yDir, true);
            if (xDir !== null) network.sendPlayerMove(game.playerId, xDir, true);
        } else {
            if (yDir !== null && yDir !== lastYDir) network.sendPlayerMove(game.playerId, yDir, true);
            if (xDir !== null && xDir !== lastXDir) network.sendPlayerMove(game.playerId, xDir, true);
        }
        lastXDir = xDir;
        lastYDir = yDir;
    }

    // Shooting - matches Java PlayState shoot cooldown exactly:
    // dex = floor((6.5 * (DEX_stat + 17.3)) / 75)
    // canShoot = (now - lastShot) > (1000 / dex + 10) ms
    if (shootCooldown > 0) shootCooldown -= dt;
    if (input.wantsShoot() && shootCooldown <= 0 && renderer) {
        const world = renderer.getWorldCoords(input.mouseX, input.mouseY, game);
        const local = game.getLocalPlayer();
        if (local) {
            const weapon = game.inventory.length > 0 ? game.inventory[0] : null;
            const projGroupId = weapon ? weapon.damage.projectileGroupId : 0;
            network.sendShoot(
                ++projectileCounter, game.playerId, projGroupId,
                world.x, world.y, local.pos.x, local.pos.y
            );
            const computed = game.getComputedStats();
            const dexStat = computed ? computed.dex : 10;
            let dex = Math.floor((6.5 * (dexStat + 17.3)) / 75);
            // SPEEDY effect (effectId=4) multiplies dex by 1.5 (matches server)
            const effects = game.effectIds || [];
            if (effects.some(id => id === 4)) dex = Math.floor(dex * 1.5);
            // DAZED effect (effectId=11) forces dex to 1
            if (effects.some(id => id === 11)) dex = 1;
            shootCooldown = (1000 / Math.max(dex, 1) + 10) / 1000;
        }
    }

    // Ability (right click)
    if (input.wantsAbility() && renderer) {
        const world = renderer.getWorldCoords(input.mouseX, input.mouseY, game);
        network.sendUseAbility(game.playerId, world.x, world.y);
    }

    // ESC = Return to character select (disconnect and switch character)
    if (input.isKeyDown('Escape')) {
        input.keys['Escape'] = false;
        returnToCharacterSelect();
        return;
    }

    // F1 = Go to vault
    if (input.isKeyDown('F1')) {
        input.keys['F1'] = false;
        doRealmTransition(null, true); // vault
    }

    // F2 = Use nearest portal
    if (input.isKeyDown('F2') || input.isKeyDown('KeyF')) {
        input.keys['F2'] = false;
        input.keys['KeyF'] = false;
        const local = game.getLocalPlayer();
        if (local) {
            let closest = null, closestDist = Infinity;
            for (const [id, portal] of game.portals) {
                const dx = portal.pos.x - local.pos.x;
                const dy = portal.pos.y - local.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) { closestDist = dist; closest = portal; }
            }
            if (closest && closestDist < 64) {
                doRealmTransition(closest, false);
            }
        }
    }

    // Number keys 1-8 = Quick use inventory items (slots 4-11)
    for (let n = 1; n <= 8; n++) {
        const key = `Digit${n}`;
        if (input.isKeyDown(key) && !input.chatMode) {
            input.keys[key] = false;
            const slotIdx = n + 3;
            const item = game.inventory[slotIdx];
            if (item && item.itemId > 0 && item.consumable) {
                network.sendMoveItem(game.playerId, slotIdx, slotIdx, false, true);
                lastInvKey = '';
            }
        }
    }

    // E = Pick up from nearest loot container (first item to first empty slot)
    if (input.isKeyDown('KeyE')) {
        input.keys['KeyE'] = false;
        const loot = game.getNearbyLootContainer(64);
        if (loot && loot.items) {
            for (let i = 0; i < loot.items.length; i++) {
                if (loot.items[i] && loot.items[i].itemId > 0) {
                    // Pick up from ground slot 20+i
                    network.sendMoveItem(game.playerId, -1, 20 + i, false, false);
                    break;
                }
            }
        }
    }
}

// --- Collision Check (matches Java TileManager.collisionTile + isVoidTile + collidesLimit) ---
function checkCollision(entity, dx, dy) {
    if (!game.mapTiles || !renderer) return false;
    const ts = renderer.tileSize || 32;
    const size = entity.size || 32;
    const futureX = entity.pos.x + dx;
    const futureY = entity.pos.y + dy;

    // Map bounds (matches Java collidesXLimit/collidesYLimit)
    const mapW = game.mapWidth * ts, mapH = game.mapHeight * ts;
    if (futureX <= 0 || futureX + size >= mapW) return true;
    if (futureY <= 0 || futureY + size >= mapH) return true;

    // Bounding box reduced by 1.5 (matches Java: size / 1.5)
    const bboxSize = size / 1.5;
    const bx = futureX + (size - bboxSize) / 2;
    const by = futureY + (size - bboxSize) / 2;

    // Check collision tiles in 5x5 area around player
    const cx = Math.floor((futureX + size / 2) / ts);
    const cy = Math.floor((futureY + size / 2) / ts);
    for (let ty = cy - 2; ty <= cy + 2; ty++) {
        for (let tx = cx - 2; tx <= cx + 2; tx++) {
            if (ty < 0 || ty >= game.mapHeight || tx < 0 || tx >= game.mapWidth) continue;
            const tile = game.mapTiles[ty]?.[tx];
            if (!tile || tile.collision <= 0) continue;
            const tileDef = game.tileData[tile.collision];
            if (!tileDef?.data?.hasCollision) continue;
            // AABB intersection
            const tl = tx * ts, tt = ty * ts;
            if (bx < tl + ts && bx + bboxSize > tl && by < tt + ts && by + bboxSize > tt) return true;
        }
    }

    // Void tile check (base layer tileId=0 at center point)
    if (cx >= 0 && cx < game.mapWidth && cy >= 0 && cy < game.mapHeight) {
        const baseTile = game.mapTiles[cy]?.[cx];
        if (baseTile && baseTile.base === 0) return true;
    }
    return false;
}

// --- HUD Update ---
function updateHUD() {
    // Use computed stats (base + equipment bonuses) for display
    const computed = game.getComputedStats();

    // HP bar - max HP from computed stats
    const maxHp = computed ? computed.hp : game.maxHealth;
    const hpPct = maxHp > 0 ? Math.min(100, game.health / maxHp * 100) : 100;
    document.getElementById('hp-bar').style.width = `${hpPct}%`;
    document.getElementById('hp-text').textContent = `${game.health}/${maxHp}`;

    // MP bar - max MP from computed stats
    const maxMp = computed ? computed.mp : game.maxMana;
    const mpPct = maxMp > 0 ? Math.min(100, game.mana / maxMp * 100) : 100;
    document.getElementById('mp-bar').style.width = `${mpPct}%`;
    document.getElementById('mp-text').textContent = `${game.mana}/${maxMp}`;

    // XP/Level/Fame
    const level = game.getPlayerLevel();
    const expInfo = game.getExpDisplayInfo();
    document.getElementById('xp-text').textContent = `Lv ${level}  ${expInfo.text}`;
    document.getElementById('xp-bar').style.width = `${expInfo.pct}%`;

    // Stats panel - show COMPUTED stats (base + equipment)
    if (computed) {
        const base = game.stats;
        // Show computed value, highlight bonus in green if equipment adds to it
        const statHtml = (label, baseVal, compVal) => {
            const bonus = compVal - baseVal;
            const bonusStr = bonus > 0 ? ` <span class="stat-bonus">+${bonus}</span>` : '';
            return `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value">${compVal}${bonusStr}</span></div>`;
        };
        document.getElementById('stats-panel').innerHTML =
            statHtml('ATT', base.att, computed.att) +
            statHtml('DEF', base.def, computed.def) +
            statHtml('SPD', base.spd, computed.spd) +
            statHtml('DEX', base.dex, computed.dex) +
            statHtml('VIT', base.vit, computed.vit) +
            statHtml('WIS', base.wis, computed.wis);
    }

    // Inventory
    updateInventoryUI();

    // Trade buttons
    const tradeBtns = document.getElementById('trade-buttons');
    if (game.isTrading) {
        tradeBtns.style.display = 'flex';
    } else {
        tradeBtns.style.display = 'none';
    }

    // Nearby players with tooltips and context menu (trade.js module)
    updateNearbyPlayers(game, network, renderer, addChatMessage);
}

// --- Inventory System ---
let selectedSlot = -1; // Currently selected slot for swap (-1 = none)
let lastInvKey = '';
let lastLootKey = '';
// Sprite data URL cache to avoid re-extracting every frame
const spriteCache = {};

function getItemSpriteUrl(item) {
    if (!item || item.itemId <= 0 || !renderer) return null;
    const cacheKey = item.itemId;
    if (spriteCache[cacheKey]) return spriteCache[cacheKey];
    const itemDef = game.itemData[item.itemId] || item;
    if (itemDef.spriteKey) {
        const url = renderer.getSpriteDataUrl(itemDef.spriteKey, itemDef.col || 0,
            itemDef.row || 0, itemDef.spriteSize || 8);
        if (url) { spriteCache[cacheKey] = url; return url; }
    }
    return null;
}

function updateInventoryUI() {
    const equipEl = document.getElementById('equip-slots');
    const invEl = document.getElementById('inv-slots');

    // Only rebuild if inventory changed
    const invKey = game.inventory.map(i => i ? i.itemId : -1).join(',') + ':' + selectedSlot;
    if (!updateInventoryUI._logged && game.inventory.length > 0) {
        updateInventoryUI._logged = true;
        console.log(`[INV] Inventory: ${game.inventory.length} items, ` +
            `IDs=[${game.inventory.map(i => i ? i.itemId : 'null').join(',')}], ` +
            `first item:`, game.inventory.find(i => i && i.itemId > 0));
    }
    if (lastInvKey === invKey) { updateGroundLootUI(); return; }
    lastInvKey = invKey;

    equipEl.innerHTML = '';
    invEl.innerHTML = '';

    const labels = ['Wpn', 'Abl', 'Amr', 'Ring'];
    for (let i = 0; i < 4; i++) {
        equipEl.appendChild(createSlot(game.inventory[i], labels[i], i));
    }
    for (let i = 4; i < 12; i++) {
        invEl.appendChild(createSlot(game.inventory[i], `${i - 3}`, i));
    }

    updateGroundLootUI();
}

function updateGroundLootUI() {
    const lootPanel = document.getElementById('ground-loot-panel');
    const lootEl = document.getElementById('ground-loot-slots');

    // During trading, show partner's items instead of ground loot
    if (game.isTrading) {
        const partnerSel = game.getPartnerTradeSelection();
        lootPanel.style.display = 'block';
        document.querySelector('#ground-loot-panel h4').textContent =
            `${game.tradePartnerName}'s Offer`;

        const items = partnerSel?.itemRefs || [];
        const selected = partnerSel?.selection || [];
        // Build key from partner items + selection
        const tradeKey = items.map((r, i) => (selected[i] ? '*' : '') + (r ? r.itemId : -1)).join(',');
        if (lastLootKey === tradeKey) return;
        lastLootKey = tradeKey;

        lootEl.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const ref = items[i];
            let item = null;
            if (ref && ref.itemId > 0 && selected[i]) {
                item = { itemId: ref.itemId, name: '', tier: -1, stats: {hp:0,mp:0,def:0,att:0,spd:0,dex:0,vit:0,wis:0},
                         damage: {projectileGroupId:0,min:0,max:0}, effect: {self:false,effectId:0,duration:0n,cooldownDuration:0n,mpCost:0},
                         consumable: false, targetSlot: 0, targetClass: -1, fameBonus: 0,
                         uid: ref.itemUuid || '', description: '' };
                const def = game.getItemDef(ref.itemId);
                if (def) { item.name = def.name; item.tier = def.tier || -1; }
            }
            const slot = createSlot(item, `${i + 1}`, 30 + i, true); // 30+ = trade display (non-interactive)
            lootEl.appendChild(slot);
        }
        return;
    }

    document.querySelector('#ground-loot-panel h4').textContent = 'Loot Bag';

    const nearbyLoot = game.getNearbyLootContainer();
    if (!nearbyLoot || !nearbyLoot.items || nearbyLoot.items.length === 0) {
        lootPanel.style.display = 'none';
        lastLootKey = '';
        return;
    }

    // Rebuild when contents change (compare item IDs)
    const lootKey = nearbyLoot.lootContainerId + ':' +
        nearbyLoot.items.map(i => i ? i.itemId : 0).join(',');
    if (lastLootKey === lootKey) return;
    lastLootKey = lootKey;

    lootPanel.style.display = 'block';
    lootEl.innerHTML = '';
    for (let i = 0; i < Math.min(8, nearbyLoot.items.length); i++) {
        const item = nearbyLoot.items[i];
        const slot = createSlot(item, `${i + 1}`, 20 + i, true);
        lootEl.appendChild(slot);
    }
}

function createSlot(item, label, slotIdx, isLoot = false) {
    const div = document.createElement('div');
    div.className = 'inv-slot' + (isLoot ? ' loot-slot' : '');
    if (slotIdx === selectedSlot) div.classList.add('selected');

    // Trade selection highlight
    if (game.isTrading && slotIdx >= 4 && slotIdx <= 11) {
        const mySel = game.getMyTradeSelection();
        if (mySel && mySel.selection && mySel.selection[slotIdx - 4]) {
            div.classList.add('selected');
        }
    }

    if (item && item.itemId > 0) {
        // Rich tooltip
        const tooltip = game.getItemTooltip(item);
        if (tooltip) div.title = tooltip;

        const spriteUrl = getItemSpriteUrl(item);
        if (spriteUrl) {
            const img = document.createElement('img');
            img.src = spriteUrl;
            div.appendChild(img);
        } else {
            const dot = document.createElement('div');
            dot.style.cssText = 'width:32px;height:32px;background:#c8a86e;border-radius:3px;';
            div.appendChild(dot);
        }

        if (item.tier >= 0) {
            const tierEl = document.createElement('span');
            tierEl.className = `item-tier tier-${Math.min(item.tier, 5)}`;
            tierEl.textContent = `T${item.tier}`;
            div.appendChild(tierEl);
        }
    }

    const lbl = document.createElement('span');
    lbl.className = 'slot-label';
    lbl.textContent = label;
    div.appendChild(lbl);

    // Left click
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`[CLICK] slot=${slotIdx} isLoot=${isLoot} itemId=${item?.itemId} item=`, item);
        onSlotClick(slotIdx, item);
    });
    // Right click
    div.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); onSlotRightClick(slotIdx, item); });

    return div;
}

// Empty item placeholder (matches server's empty slot representation)
const EMPTY_ITEM = { itemId: 0, uid: '', name: '', description: '',
    stats: {hp:0,mp:0,def:0,att:0,spd:0,dex:0,vit:0,wis:0},
    damage: {projectileGroupId:0,min:0,max:0},
    effect: {self:false,effectId:0,duration:0n,cooldownDuration:0n,mpCost:0},
    consumable: false, tier: -1, targetSlot: 0, targetClass: -1, fameBonus: 0 };

function onSlotClick(slotIdx, item, isRightClick = false) {
    // During trading, right-click toggles item selection
    if (game.isTrading && isRightClick && slotIdx >= 4 && slotIdx <= 11) {
        toggleTradeSelection(slotIdx);
        return;
    }

    // Ground loot: single click = pick up to first empty inv slot
    if (slotIdx >= 20 && slotIdx <= 27 && item && item.itemId > 0) {
        console.log(`[INV] Picking up from ground slot ${slotIdx}, itemId=${item.itemId}`);
        // Send with target=4 (first inv slot) so server's isInv1 check passes
        // Server will use firstEmptyInvSlot() regardless
        network.sendMoveItem(game.playerId, 4, slotIdx, false, false);
        lastInvKey = ''; lastLootKey = '';
        return;
    }

    if (selectedSlot === -1) {
        // Nothing selected - select this slot if it has an item
        if (item && item.itemId > 0) {
            selectedSlot = slotIdx;
            lastInvKey = '';
        }
    } else {
        if (slotIdx === selectedSlot) {
            selectedSlot = -1; // Deselect
        } else if (selectedSlot >= 0 && selectedSlot <= 11 && slotIdx >= 0 && slotIdx <= 11) {
            // Swap/equip/move between slots 0-11
            console.log(`[INV] Swap slot ${selectedSlot} <-> slot ${slotIdx}`);
            network.sendMoveItem(game.playerId, slotIdx, selectedSlot, false, false);
            selectedSlot = -1;
        } else {
            selectedSlot = -1;
        }
        lastInvKey = ''; lastLootKey = '';
    }
}

function onSlotRightClick(slotIdx, item) {
    if (game.isTrading) {
        onSlotClick(slotIdx, item, true);
        return;
    }
    // Right-click: drop item to ground
    if (item && item.itemId > 0 && slotIdx >= 0 && slotIdx <= 11) {
        console.log(`[INV] Dropping item from slot ${slotIdx}`);
        network.sendMoveItem(game.playerId, -1, slotIdx, true, false);
        lastInvKey = '';
    }
}

function toggleTradeSelection(slotIdx) {
    // Build selection array for trade: slots 4-11 → Boolean[0-7]
    const mySel = game.getMyTradeSelection();
    if (!mySel) return;
    const selIdx = slotIdx - 4;
    if (selIdx < 0 || selIdx >= 8) return;
    // Toggle
    if (!mySel.selection) mySel.selection = new Array(8).fill(false);
    mySel.selection[selIdx] = !mySel.selection[selIdx];
    // Send UpdatePlayerTradeSelectionPacket
    // TODO: need to build and send this packet
    network.sendText(game.playerName, 'Player',
        `/confirm false`); // Reset confirmation on selection change
    lastInvKey = '';
}

// Drop selected item when clicking game canvas (outside inventory)
document.getElementById('game-canvas-container').addEventListener('click', () => {
    if (selectedSlot >= 0 && selectedSlot <= 11 && currentScreen === 'game') {
        console.log(`[INV] Dropping item from slot ${selectedSlot} (canvas click)`);
        network.sendMoveItem(game.playerId, -1, selectedSlot, true, false);
        selectedSlot = -1;
        lastInvKey = '';
    }
});

// --- Chat ---
function addChatMessage(from, message) {
    const el = document.getElementById('chat-messages');
    const div = document.createElement('div');
    if (from === 'SYSTEM') {
        div.className = 'msg-system';
        div.textContent = message;
    } else {
        div.className = 'msg-player';
        div.innerHTML = `<span class="msg-name">${escapeHtml(from)}</span>: ${escapeHtml(message)}`;
    }
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
}

function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

// Chat input
const chatInput = document.getElementById('chat-input');
chatInput.addEventListener('focus', () => { input.chatMode = true; });
chatInput.addEventListener('blur', () => { input.chatMode = false; });
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const msg = chatInput.value.trim();
        if (msg) {
            if (msg.startsWith('/')) {
                handleChatCommand(msg);
            } else {
                network.sendText(game.playerName || 'Player', 'Player', msg);
            }
            chatInput.value = '';
        }
        chatInput.blur();
    }
    if (e.key === 'Escape') {
        chatInput.value = '';
        chatInput.blur();
    }
});

function handleChatCommand(msg) {
    // ServerCommandMessage format: {"command": "cmdname", "args": ["arg1", "arg2"]}
    // Matches Java's ServerCommandMessage.parseFromInput(): command = first word, args = rest
    const parts = msg.substring(1).split(' '); // Remove leading /
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Client-only commands
    if (cmd === 'clear') {
        game.chatMessages = [];
        document.getElementById('chat-messages').innerHTML = '';
        return;
    }

    // Send as ServerCommandMessage via CommandPacket (commandId byte = 3 = SERVER_COMMAND)
    const payload = JSON.stringify({ command: cmd, args: args });
    network.send(PacketWriters.command(game.playerId, 3, payload));

    // Local feedback for known commands
    if (cmd === 'trade' && args.length > 0) {
        addChatMessage('SYSTEM', `Trade request sent to ${args[0]}`);
    } else if (cmd === 'confirm' && args[0] === 'true') {
        game.tradeConfirmed = true;
        addChatMessage('SYSTEM', 'Trade confirmed. Waiting for partner...');
    }
}

// Enter key opens chat
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement !== chatInput && currentScreen === 'game') {
        chatInput.focus();
    }
});

// --- Trade Buttons ---
document.getElementById('trade-confirm-btn').addEventListener('click', () => {
    handleChatCommand('/confirm true');
});
document.getElementById('trade-cancel-btn').addEventListener('click', () => {
    handleChatCommand('/decline');
});

// --- Init ---
showScreen('login');
