// JRealm Web Client - Main Entry Point

import { ApiClient } from './api.js';
import { GameNetwork } from './network.js';
import { GameState, CLASS_NAMES } from './game.js';
import { GameRenderer } from './renderer.js';
import { InputHandler } from './input.js';
import { PacketId, PacketWriters } from './codec.js';

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
let lastMoveDir = -1;
let lastMoving = false;
let shootCooldown = 0;
let projectileCounter = 0;

// --- Sprite sheets to load ---
const SPRITE_SHEETS = [
    'rotmg-classes-0.png', 'rotmg-classes-1.png', 'rotmg-classes-2.png', 'rotmg-classes-3.png',
    'rotmg-bosses.png', 'rotmg-bosses-1.png',
    'rotmg-projectiles.png',
    'rotmg-items.png', 'rotmg-items-1.png',
    'rotmg-tiles.png', 'rotmg-tiles-1.png', 'rotmg-tiles-2.png',
    'rotmg-tiles-all.png', 'rotmg-tiles-1_0.png', 'rotmg-tiles-1_.png',
    'lofi_char.png', 'lofi_environment.png', 'lofi_obj.png',
    'lofi_obj_packA.png', 'lofi_obj_packB.png',
    'buttons.png', 'fillbars.png', 'slots.png',
    'rotmg-misc.png'
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

// --- Character Select ---
function showCharacterSelect() {
    showScreen('charselect');
    const listEl = document.getElementById('char-list');
    listEl.innerHTML = '';

    if (!account.characters || account.characters.length === 0) {
        listEl.innerHTML = '<p style="color:#887868">No characters found on this account.</p>';
        return;
    }

    for (const char of account.characters) {
        const card = document.createElement('div');
        card.className = 'char-card';
        const className = CLASS_NAMES[char.characterClass] || `Class ${char.characterClass}`;
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
                <div class="char-details">${char.characterUuid}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedCharacter = char;
            document.getElementById('play-btn').disabled = false;
        });
        listEl.appendChild(card);
    }
}

document.getElementById('play-btn').addEventListener('click', () => {
    if (selectedCharacter) startGame();
});

document.getElementById('logout-btn').addEventListener('click', () => {
    account = null;
    selectedCharacter = null;
    showScreen('login');
});

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
                        size: 8,
                        animFrame: 0, animTimer: 0, facing: 'right'
                    });

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
        console.log(`[GAME] Load: players=${data.players.length}, enemies=${data.enemies.length}, ` +
            `bullets=${data.bullets.length}, containers=${data.containers.length}, portals=${data.portals.length}`);
        game.handleLoad(data);
    });
    network.on(PacketId.UNLOAD, (data) => game.handleUnload(data));
    network.on(PacketId.OBJECT_MOVE, (data) => game.handleObjectMove(data));
    network.on(PacketId.UPDATE, (data) => {
        if (data.playerId === game.playerId) {
            console.log(`[GAME] Update (self): hp=${data.health}/${data.stats.hp}, ` +
                `mp=${data.mana}/${data.stats.mp}, inv=${data.inventory.length} items`);
        }
        game.handleUpdate(data);
    });

    network.on(PacketId.TEXT, (data) => {
        game.handleText(data);
        addChatMessage(data.from, data.message);
    });

    network.on(PacketId.TEXT_EFFECT, (data) => {
        // Could render floating damage text - for now just log
    });

    network.on(PacketId.PLAYER_DEATH, (data) => {
        if (data.playerId === game.playerId) {
            addChatMessage('SYSTEM', 'You have died!');
            network.send(PacketWriters.deathAck(game.playerId));
        }
    });

    network.on(PacketId.CREATE_EFFECT, (data) => {
        // Visual effects - could render particles
    });
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
    const movement = input.getMovementDirection();

    // Send move packet only when direction changes
    if (movement.dir !== lastMoveDir || movement.moving !== lastMoving) {
        network.sendPlayerMove(game.playerId, movement.dir, movement.moving);
        lastMoveDir = movement.dir;
        lastMoving = movement.moving;
    }

    // Shooting
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
            // Cooldown based on DEX stat
            const dex = game.stats ? game.stats.dex : 10;
            shootCooldown = 1.0 / (1.5 + 6.5 * (dex / 75.0));
        }
    }

    // Ability (right click)
    if (input.wantsAbility() && renderer) {
        const world = renderer.getWorldCoords(input.mouseX, input.mouseY, game);
        network.sendUseAbility(game.playerId, world.x, world.y);
    }

    // Portal interaction (F key)
    if (input.isKeyDown('KeyF')) {
        input.keys['KeyF'] = false; // Consume
        // Find nearest portal
        let closest = null;
        let closestDist = Infinity;
        const local = game.getLocalPlayer();
        if (local) {
            for (const [id, portal] of game.portals) {
                const dx = portal.pos.x - local.pos.x;
                const dy = portal.pos.y - local.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = portal;
                }
            }
            if (closest && closestDist < 64) {
                network.sendUsePortal(closest.id, game.realmId, game.playerId, 0, 0);
            }
        }
    }
}

// --- HUD Update ---
function updateHUD() {
    // HP bar
    const hpPct = game.maxHealth > 0 ? (game.health / game.maxHealth * 100) : 100;
    document.getElementById('hp-bar').style.width = `${hpPct}%`;
    document.getElementById('hp-text').textContent = `${game.health}/${game.maxHealth}`;

    // MP bar
    const mpPct = game.maxMana > 0 ? (game.mana / game.maxMana * 100) : 100;
    document.getElementById('mp-bar').style.width = `${mpPct}%`;
    document.getElementById('mp-text').textContent = `${game.mana}/${game.maxMana}`;

    // XP/Level
    const level = game.getPlayerLevel();
    document.getElementById('xp-text').textContent = `Lv ${level} (${game.experience} XP)`;
    document.getElementById('xp-bar').style.width = `${Math.min(100, (level / 20) * 100)}%`;

    // Stats panel
    if (game.stats) {
        const s = game.stats;
        document.getElementById('stats-panel').innerHTML = `
            <div class="stat-row"><span class="stat-label">ATT</span><span class="stat-value">${s.att}</span></div>
            <div class="stat-row"><span class="stat-label">DEF</span><span class="stat-value">${s.def}</span></div>
            <div class="stat-row"><span class="stat-label">SPD</span><span class="stat-value">${s.spd}</span></div>
            <div class="stat-row"><span class="stat-label">DEX</span><span class="stat-value">${s.dex}</span></div>
            <div class="stat-row"><span class="stat-label">VIT</span><span class="stat-value">${s.vit}</span></div>
            <div class="stat-row"><span class="stat-label">WIS</span><span class="stat-value">${s.wis}</span></div>
        `;
    }

    // Inventory
    updateInventoryUI();
}

function updateInventoryUI() {
    const equipEl = document.getElementById('equip-slots');
    const invEl = document.getElementById('inv-slots');

    // Only rebuild if inventory changed
    const invKey = game.inventory.map(i => i ? i.itemId : -1).join(',');
    if (equipEl.dataset.key === invKey) return;
    equipEl.dataset.key = invKey;

    equipEl.innerHTML = '';
    invEl.innerHTML = '';

    const labels = ['Weapon', 'Ability', 'Armor', 'Ring'];
    for (let i = 0; i < 4; i++) {
        const slot = createSlot(game.inventory[i], labels[i]);
        equipEl.appendChild(slot);
    }
    for (let i = 4; i < 12; i++) {
        const slot = createSlot(game.inventory[i], `${i - 3}`);
        invEl.appendChild(slot);
    }
}

function createSlot(item, label) {
    const div = document.createElement('div');
    div.className = 'inv-slot';
    if (item && item.itemId > 0) {
        // Try to render item sprite
        const itemDef = game.itemData[item.itemId];
        if (itemDef) {
            div.title = `${item.name || itemDef.name || 'Item'}\n${item.description || ''}`;
        }
        // Simple colored indicator for now
        const dot = document.createElement('div');
        dot.style.cssText = `width:24px;height:24px;background:#c8a86e;border-radius:3px;`;
        div.appendChild(dot);
    }
    const lbl = document.createElement('span');
    lbl.className = 'slot-label';
    lbl.textContent = label;
    div.appendChild(lbl);
    return div;
}

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
            network.sendText(game.playerName || 'Player', 'Player', msg);
            chatInput.value = '';
        }
        chatInput.blur();
    }
    if (e.key === 'Escape') {
        chatInput.value = '';
        chatInput.blur();
    }
});

// Enter key opens chat
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement !== chatInput && currentScreen === 'game') {
        chatInput.focus();
    }
});

// --- Init ---
showScreen('login');
