// OpenRealm Web Client - Main Entry Point

// Strip credentials from URL immediately on load (prevents login data leaking via GET params)
if (window.location.search) {
    window.history.replaceState({}, '', window.location.pathname);
}

import { ApiClient } from './api.js';
import { GameNetwork } from './network.js';
import { GameState, CLASS_NAMES } from './game.js';
import { GameRenderer } from './renderer.js';
import { InputHandler } from './input.js';
import { PacketId, PacketWriters } from './codec.js';
import { initTradeUI, updateNearbyPlayers } from './trade.js';
import { initTouchControls, isTouchDevice, getJoystickDir, getAimDir, setDoubleTapHandler } from './touch.js';
import { Minimap } from './minimap.js';

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
let minimap = null;

// --- Sprite sheets to load ---
// Must match Java GameSpriteManager.SPRITE_NAMES exactly
const SPRITE_SHEETS = [
    'rotmg-projectiles.png',
    'rotmg-bosses.png', 'rotmg-bosses-1.png', 'rotmg-bosses-1_.png',
    'rotmg-items.png', 'rotmg-items-1.png',
    'rotmg-tiles.png', 'rotmg-tiles-1.png', 'rotmg-tiles-2.png', 'rotmg-tiles-all.png',
    'rotmg-abilities.png', 'rotmg-misc.png',
    'rotmg-classes-0.png', 'rotmg-classes-1.png', 'rotmg-classes-2.png', 'rotmg-classes-3.png',
    'lofi_char.png', 'lofi_environment.png', 'lofi_obj.png', 'lofiObj2.png', 'lofiObj3.png', 'lofiObjBig.png',
    'lofiEnvironment.png', 'lofiEnvironment2.png', 'lofiEnvironment3.png',
    'lofi_dungeon_features.png',
    'chars8x8rBeach.png', 'chars8x8rHero2.png', 'cursedLibraryChars16x16.png',
    'd1Chars16x16r.png', 'd3Chars8x8r.png', 'cursedLibraryChars8x8.png', 'cursedLibraryObjects8x8.png',
    'd2LofiObj.png', 'd3LofiObj.png', 'lofiProjs.png', 'chars16x16dEncounters.png',
    'archbishopObjects16x16.png', 'autumnNexusObjects16x16.png',
    'chars16x16dEncounters2.png', 'crystalCaveChars16x16.png',
    'crystalCaveObjects8x8.png', 'fungalCavernObjects8x8.png',
    'epicHiveChars8x8.png', 'lairOfDraconisChars8x8.png', 'lairOfDraconisObjects8x8.png',
    'lostHallsObjects8x8.png', 'magicWoodsObjects8x8.png', 'mountainTempleObjects8x8.png',
    'summerNexusObjects8x8.png',
    'oryxHordeChars16x16.png', 'oryxHordeChars8x8.png',
    'secludedThicketChars16x16.png'
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
        // Load animation data for character select icons (front-facing idle)
        try {
            const animData = await api.getGameData('animations.json');
            _animDataByClass = {};
            if (Array.isArray(animData)) animData.forEach(a => { if (a.objectType === 'player') _animDataByClass[a.objectId] = a; });
        } catch (e) { /* non-critical */ }
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

// --- Character sprite sheets (preloaded for character select) ---
const _charSpriteSheets = {};
(function preloadClassSprites() {
    for (let i = 0; i < 4; i++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = api.getSpriteUrl(`rotmg-classes-${i}.png`);
        img.onload = () => { _charSpriteSheets[`rotmg-classes-${i}`] = img; };
    }
})();

// --- Character Select & Management ---
const ALL_CLASSES = [
    'Rogue', 'Archer', 'Wizard', 'Priest', 'Warrior', 'Knight',
    'Paladin', 'Assassin', 'Necromancer', 'Mystic', 'Trickster', 'Sorcerer'
];
let selectedClassId = null;
let _animDataByClass = {}; // classId -> animation model, loaded once for char select icons

// Draw the idle_front frame for a class using animations.json data, with fallback to legacy math
function drawClassIcon(canvas, classId) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const anim = _animDataByClass[classId];
    if (anim && anim.animations && anim.animations.idle_front) {
        const frame = anim.animations.idle_front.frames[0];
        const img = _charSpriteSheets[anim.spriteKey.replace('.png', '')];
        if (img) {
            ctx.drawImage(img, frame.col * 8, frame.row * 8, 8, 8, 0, 0, canvas.width, canvas.height);
            return;
        }
    }
    // Fallback: legacy side-idle
    const sheetIdx = Math.floor(classId / 3);
    const localRow = (classId % 3) * 4;
    const img = _charSpriteSheets[`rotmg-classes-${sheetIdx}`];
    if (img) ctx.drawImage(img, 0, localRow * 8, 8, 8, 0, 0, canvas.width, canvas.height);
}

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
            const iconDiv = document.createElement('div');
            iconDiv.className = 'char-icon';
            const classId = char.characterClass || 0;
            const cvs = document.createElement('canvas');
            cvs.width = 40; cvs.height = 40;
            drawClassIcon(cvs, classId);
            iconDiv.appendChild(cvs);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'char-info';
            infoDiv.innerHTML = `
                <div class="char-name">${className}</div>
                <div class="char-details">
                    HP: ${stats.hp ?? '?'} | MP: ${stats.mp ?? '?'} |
                    ATT: ${stats.att ?? '?'} | DEF: ${stats.def ?? '?'} |
                    SPD: ${stats.spd ?? '?'} | DEX: ${stats.dex ?? '?'}
                </div>
                <div class="char-details" style="font-size:10px;color:#665848">${char.characterUuid}</div>
            `;
            card.appendChild(iconDiv);
            card.appendChild(infoDiv);
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
        const cCvs = document.createElement('canvas');
        cCvs.width = 28; cCvs.height = 28;
        cCvs.style.cssText = 'vertical-align:middle;margin-right:6px;';
        drawClassIcon(cCvs, i);
        opt.appendChild(cCvs);
        opt.appendChild(document.createTextNode(ALL_CLASSES[i]));
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

    // Load leaderboard
    loadLeaderboard();
}

async function loadLeaderboard() {
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = '<p style="color:#887868">Loading...</p>';
    try {
        const entries = await api.request('GET', '/data/stats/top?count=25');
        if (!entries || entries.length === 0) {
            listEl.innerHTML = '<p style="color:#887868">No characters yet.</p>';
            return;
        }
        listEl.innerHTML = '';
        entries.forEach((entry, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';

            const rank = document.createElement('span');
            rank.className = 'lb-rank';
            rank.textContent = `#${idx + 1}`;

            const icon = document.createElement('canvas');
            icon.width = 24; icon.height = 24;
            icon.style.cssText = 'vertical-align:middle;margin-right:6px';
            drawClassIcon(icon, entry.characterClass || 0);

            const info = document.createElement('span');
            info.className = 'lb-info';
            const isFameMode = (entry.fame || 0) > 0;
            info.textContent = `${entry.accountName} - ${entry.className} Lv. ${isFameMode ? 20 : entry.level}`;

            const fame = document.createElement('span');
            fame.className = 'lb-fame';
            fame.textContent = isFameMode
                ? `Fame: ${entry.fame.toLocaleString()}`
                : `XP: ${(entry.stats && entry.stats.xp != null ? entry.stats.xp : 0).toLocaleString()}`;

            row.append(rank, icon, info, fame);

            // Equipment tooltip on hover
            if (entry.equipment && entry.equipment.length > 0) {
                row.addEventListener('mouseenter', (e) => {
                    showEquipmentTooltip(e, entry);
                });
                row.addEventListener('mouseleave', () => {
                    hideEquipmentTooltip();
                });
            }
            listEl.appendChild(row);
        });
    } catch (e) {
        listEl.innerHTML = `<p style="color:#c44">${e.message}</p>`;
    }
}

function showEquipmentTooltip(event, entry) {
    let tip = document.getElementById('lb-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'lb-tooltip';
        document.body.appendChild(tip);
    }
    const slotNames = ['Weapon', 'Ability', 'Armor', 'Ring'];
    let html = `<div class="lb-tooltip-title">${entry.accountName}'s ${entry.className}</div>`;
    html += '<div class="lb-tooltip-equip">';
    for (let i = 0; i < 4; i++) {
        const equip = entry.equipment.find(e => e.slotIdx === i);
        if (equip && equip.itemId >= 0) {
            const itemDef = game.itemData?.[equip.itemId];
            const name = itemDef?.name || `Item ${equip.itemId}`;
            const spriteUrl = getItemSpriteUrl({ itemId: equip.itemId });
            const imgTag = spriteUrl
                ? `<img src="${spriteUrl}" class="lb-tooltip-sprite">`
                : '<span class="lb-tooltip-sprite-empty"></span>';
            const tierTag = itemDef?.tier >= 0 ? `<span class="lb-tooltip-tier">T${itemDef.tier}</span>` : '';
            html += `<div class="lb-tooltip-item">${imgTag}<span class="lb-tooltip-slot">${slotNames[i]}:</span> ${name}${tierTag}</div>`;
        } else {
            html += `<div class="lb-tooltip-item" style="color:#665848"><span class="lb-tooltip-sprite-empty"></span><span class="lb-tooltip-slot">${slotNames[i]}:</span> Empty</div>`;
        }
    }
    html += '</div>';
    if (entry.stats) {
        const s = entry.stats;
        html += '<div class="lb-tooltip-stats">'
            + `<div class="lb-stat"><span class="lb-stat-label">HP</span><span class="lb-stat-val lb-stat-hp">${s.hp ?? 0}</span></div>`
            + `<div class="lb-stat"><span class="lb-stat-label">MP</span><span class="lb-stat-val lb-stat-mp">${s.mp ?? 0}</span></div>`
            + `<div class="lb-stat"><span class="lb-stat-label">ATT</span><span class="lb-stat-val">${s.att ?? 0}</span></div>`
            + `<div class="lb-stat"><span class="lb-stat-label">DEF</span><span class="lb-stat-val">${s.def ?? 0}</span></div>`
            + `<div class="lb-stat"><span class="lb-stat-label">SPD</span><span class="lb-stat-val">${s.spd ?? 0}</span></div>`
            + `<div class="lb-stat"><span class="lb-stat-label">DEX</span><span class="lb-stat-val">${s.dex ?? 0}</span></div>`
            + `<div class="lb-stat"><span class="lb-stat-label">VIT</span><span class="lb-stat-val">${s.vit ?? 0}</span></div>`
            + `<div class="lb-stat"><span class="lb-stat-label">WIS</span><span class="lb-stat-val">${s.wis ?? 0}</span></div>`
            + '</div>';
    }
    tip.innerHTML = html;
    tip.style.display = 'block';
    tip.style.left = (event.pageX + 12) + 'px';
    tip.style.top = (event.pageY - 10) + 'px';
}

function hideEquipmentTooltip() {
    const tip = document.getElementById('lb-tooltip');
    if (tip) tip.style.display = 'none';
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

document.getElementById('change-pw-btn').addEventListener('click', async () => {
    const curr = document.getElementById('current-pw').value;
    const newPw = document.getElementById('new-pw').value;
    const confirm = document.getElementById('confirm-pw').value;
    const status = document.getElementById('pw-status');
    status.className = 'error';
    if (!curr || !newPw) { status.textContent = 'Fill in all fields'; return; }
    if (newPw !== confirm) { status.textContent = 'Passwords do not match'; return; }
    if (newPw.length < 4) { status.textContent = 'Password too short'; return; }
    try {
        await api.changePassword(curr, newPw);
        status.textContent = 'Password changed! Signing you back in...';
        status.className = 'error success';
        // Re-login with new password to get fresh session token
        const email = document.getElementById('email').value;
        const loginData = await api.login(email, newPw);
        account = await api.getAccount(loginData.accountGuid);
        status.textContent = 'Password changed successfully!';
        document.getElementById('current-pw').value = '';
        document.getElementById('new-pw').value = '';
        document.getElementById('confirm-pw').value = '';
        // Update the login form password field so next login works
        document.getElementById('password').value = newPw;
    } catch (e) {
        status.textContent = e.message;
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

    // Clean reset for reconnection — clear old handlers, state, renderer
    network.reset();
    game.fullReset();
    lastXDir = null; lastYDir = null;
    selectedSlot = -1;
    lastInvKey = ''; lastLootKey = '';
    if (renderer) { renderer.destroy(); renderer = null; }

    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = 'Loading assets...';
    statusEl.className = '';

    // Init renderer
    const container = document.getElementById('game-canvas-container');
    renderer = new GameRenderer(container);
    await renderer.init();

    // Load game data
    try {
        const [tileData, enemyData, itemData, charClasses, portalData, projGroups, expLevels, mapData, lootContainerDefs, animData] = await Promise.all([
            api.getGameData('tiles.json'),
            api.getGameData('enemies.json'),
            api.getGameData('game-items.json'),
            api.getGameData('character-classes.json'),
            api.getGameData('portals.json'),
            api.getGameData('projectile-groups.json'),
            api.getGameData('exp-levels.json'),
            api.getGameData('maps.json'),
            api.getGameData('loot-containers.json'),
            api.getGameData('animations.json')
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

        // Index loot container definitions by tierId
        game.lootContainerDefs = {};
        if (Array.isArray(lootContainerDefs)) lootContainerDefs.forEach(d => game.lootContainerDefs[d.tierId] = d);

        // Index animation definitions by "type:id" key
        game.animations = {};
        if (Array.isArray(animData)) animData.forEach(a => game.animations[`${a.objectType}:${a.objectId}`] = a);

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

    // Init mobile touch controls
    initTouchControls(input);

    // Double-tap = use ability at tap location
    setDoubleTapHandler((screenX, screenY) => {
        if (!game.playerId || !renderer) return;
        const world = renderer.getWorldCoords(screenX, screenY, game);
        network.sendUseAbility(game.playerId, world.x, world.y);
    });

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
                    network.onHeartbeatSend = () => perfMetrics.recordHeartbeatSend();
                    network.onServerPacket = () => perfMetrics.recordServerPacket();
                    network.startHeartbeat(game.playerId);

                    const statusEl = document.getElementById('connection-status');
                    statusEl.textContent = 'Connected';
                    statusEl.className = 'connected';

                    addChatMessage('SYSTEM', `Welcome to OpenRealm Server 0.5.0 — Playing as ${CLASS_NAMES[loginResp.classId]}`);
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
        // Build minimap tile cache only on actual map change
        if (!minimap) {
            minimap = new Minimap(document.getElementById('minimap-canvas'));
            minimap.onTeleport = (playerName) => {
                handleChatCommand('/tp ' + playerName);
                addChatMessage('SYSTEM', `Teleporting to ${playerName}...`);
            };
        }
        // Initialize/resize minimap tile cache on map dimension change,
        // then paint the tiles that just arrived
        minimap.buildTileCache(game);
        minimap.paintTiles(game, data.tiles);
    });
    network.on(PacketId.LOAD, (data) => {
        game.handleLoad(data);
        // Force loot UI refresh when containers change
        if (data.containers.length > 0) {
            lastLootKey = '';
            for (const c of data.containers) {
                const itemIds = c.items.map(i => i ? i.itemId : -1);
                // Loot container log removed for performance
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
        addChatMessage(data.from, data.message, data.to);
    });

    network.on(PacketId.TEXT_EFFECT, (data) => {
        game.handleTextEffect(data);
    });

    network.on(PacketId.PLAYER_DEATH, (data) => {
        if (data.playerId === game.playerId) {
            handlePlayerDeath();
        }
    });

    network.on(PacketId.PLAYER_STATE, (data) => {
        game.handlePlayerState(data);
    });

    // Server reconciliation: server sends authoritative position + last processed input seq.
    // Client discards acknowledged inputs and replays remaining ones from server position.
    network.on(PacketId.PLAYER_POS_ACK, (data) => {
        game.handlePosAck(data);
    });

    network.on(PacketId.GLOBAL_PLAYER_POSITION, (data) => {
        game.handleGlobalPlayerPosition(data);
    });

    network.on(PacketId.CREATE_EFFECT, (data) => {
        // Visual particle effect — add to game's effect queue for rendering
        game.addVisualEffect({
            type: data.effectType,
            x: data.posX, y: data.posY,
            radius: data.radius,
            duration: data.duration,
            targetX: data.targetPosX, targetY: data.targetPosY,
            startTime: Date.now()
        });
    });

    // Trading handlers managed by trade.js module
    initTradeUI(game, network, addChatMessage, () => {
        lastInvKey = ''; lastLootKey = '';
    });
}

// --- Performance Metrics ---
const perfMetrics = {
    fps: 0, _frameCount: 0, _lastFpsSample: 0,
    ping: 0, jitter: 0,
    _pingSamples: [], _lastHeartbeatSend: 0,
    _lastServerPacketTime: 0,
    memoryMB: 0,
    update(timestamp) {
        // FPS counter (sampled every 500ms)
        this._frameCount++;
        if (timestamp - this._lastFpsSample >= 500) {
            this.fps = Math.round(this._frameCount / ((timestamp - this._lastFpsSample) / 1000));
            this._frameCount = 0;
            this._lastFpsSample = timestamp;
        }
        // Memory (if available)
        if (performance.memory) {
            this.memoryMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
        }
    },
    recordHeartbeatSend() {
        this._lastHeartbeatSend = Date.now();
    },
    recordServerPacket() {
        if (this._lastHeartbeatSend > 0) {
            const rtt = Date.now() - this._lastHeartbeatSend;
            // Only count reasonable RTTs (< 2s) as ping samples
            if (rtt > 0 && rtt < 2000) {
                this._pingSamples.push(rtt);
                if (this._pingSamples.length > 10) this._pingSamples.shift();
                // Ping = average RTT / 2
                const avg = this._pingSamples.reduce((a, b) => a + b, 0) / this._pingSamples.length;
                this.ping = Math.round(avg / 2);
                // Jitter = stddev of samples
                const variance = this._pingSamples.reduce((sum, s) => sum + (s - avg) ** 2, 0) / this._pingSamples.length;
                this.jitter = Math.round(Math.sqrt(variance));
            }
            this._lastHeartbeatSend = 0;
        }
    }
};

// --- Game Loop ---
let lastTime = 0;
function gameLoop(timestamp) {
    if (lastTime === 0) lastTime = timestamp; // prevent massive first-frame dt
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap delta at 50ms
    lastTime = timestamp;
    perfMetrics.update(timestamp);

    if (currentScreen === 'game' && game.playerId !== null) {
        // Process input
        processInput(dt);

        // Update interpolation
        game.updateInterpolation(dt);

        // Render
        if (renderer) {
            renderer.render(game);
        }

        // Update minimap
        if (minimap) minimap.render(game);

        // Update HUD + perf overlay
        updateHUD();
        updatePerfOverlay();
    }

    requestAnimationFrame(gameLoop);
}

// --- Input Processing ---
function processInput(dt) {
    // Determine current X and Y axis directions from keyboard or touch joystick
    let xDir = null;
    let yDir = null;
    if (!input.chatMode) {
        if (isTouchDevice()) {
            const joy = getJoystickDir();
            xDir = joy.xDir;
            yDir = joy.yDir;
        } else {
            if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) xDir = 2;
            else if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) xDir = 3;
            if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) yDir = 0;
            else if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) yDir = 1;
        }
    }

    // --- Send direction packets to server with sequence number ---
    // Rate-limit direction changes to prevent packet flooding from analog stick drift.
    // At most 1 direction change per 50ms (20 changes/sec max).
    if (!game._lastDirChangeTime) game._lastDirChangeTime = 0;
    const dirChangeThrottle = performance.now() - game._lastDirChangeTime > 50;
    if ((xDir !== lastXDir || yDir !== lastYDir) && dirChangeThrottle) {
        game._lastDirChangeTime = performance.now();
        const isMoving = xDir !== null || yDir !== null;

        if (!isMoving) {
            game._inputSeq = (game._inputSeq || 0) + 1;
            network.sendPlayerMove(game.playerId, 4, false, game._inputSeq);
        } else {
            if (yDir !== lastYDir) {
                if (lastYDir !== null) {
                    game._inputSeq = (game._inputSeq || 0) + 1;
                    network.sendPlayerMove(game.playerId, lastYDir, false, game._inputSeq);
                }
                if (yDir !== null) {
                    game._inputSeq = (game._inputSeq || 0) + 1;
                    network.sendPlayerMove(game.playerId, yDir, true, game._inputSeq);
                }
            }
            if (xDir !== lastXDir) {
                if (lastXDir !== null) {
                    game._inputSeq = (game._inputSeq || 0) + 1;
                    network.sendPlayerMove(game.playerId, lastXDir, false, game._inputSeq);
                }
                if (xDir !== null) {
                    game._inputSeq = (game._inputSeq || 0) + 1;
                    network.sendPlayerMove(game.playerId, xDir, true, game._inputSeq);
                }
            }
        }
        lastXDir = xDir;
        lastYDir = yDir;
    }

    // Local player velocity prediction + input buffer for server reconciliation.
    // Each frame: compute velocity from current input, store in input buffer,
    // apply locally with collision checks. When server acks a seq, replay
    // all inputs after that seq from the server's authoritative position.
    const local = game.getLocalPlayer();
    if (local) {
        const computed = game.getComputedStats();
        const spdStat = computed ? computed.spd : 10;
        let tilesPerSec = 4.0 + 5.6 * (spdStat / 75.0);
        const effects = game.effectIds || [];
        if (effects.some(id => id === 4)) tilesPerSec *= 1.5;  // SPEEDY
        if (effects.some(id => id === 2)) tilesPerSec = 0;      // PARALYZED
        // DAZED (11) only affects dex/attack speed, not movement speed
        let spd = tilesPerSec * 32.0 / 64.0;

        let pdx = 0, pdy = 0;
        if (yDir === 0) pdy = -1;
        if (yDir === 1) pdy = 1;
        if (xDir === 2) pdx = 1;
        if (xDir === 3) pdx = -1;
        if (pdx !== 0 && pdy !== 0) {
            spd = spd * Math.sqrt(2) / 2;
        }
        local.dx = pdx * spd;
        local.dy = pdy * spd;

        // Store this frame's input in the buffer with a per-frame tick counter.
        // The server increments lastInputSeq every tick in movePlayer().
        // The ack sends the server's tick count, which we use to discard
        // the corresponding number of client frames.
        game._frameTick = (game._frameTick || 0) + 1;
        if (!game._inputBuffer) game._inputBuffer = [];
        game._inputBuffer.push({
            tick: game._frameTick,
            dx: local.dx,
            dy: local.dy,
            dt: dt
        });
        // Cap buffer to prevent memory leak (5 seconds of frames)
        if (game._inputBuffer.length > 300) game._inputBuffer.shift();
    }

    // Shooting — uses wall-clock timestamp to match server's absolute time check.
    // Server: canShoot = (now - lastShotTime) > (1000 / dex)
    if (!game._lastShotTime) game._lastShotTime = 0;
    const aim = isTouchDevice() ? getAimDir() : null;
    const wantsShoot = aim ? aim.shooting : input.wantsShoot();
    // Tick down shooting animation timer
    if (game.shootingAnimTimer > 0) {
        game.shootingAnimTimer -= dt;
        if (game.shootingAnimTimer <= 0) {
            game.shootingAnim = null;
            game.attackFrame = 0;
            game.attackFrameTimer = 0;
        }
    }
    // Cycle attack animation frames while shooting
    if (game.shootingAnim) {
        game.attackFrameTimer += dt;
        if (game.attackFrameTimer > 0.08) { // ~80ms per frame
            game.attackFrameTimer = 0;
            game.attackFrame++;
        }
    }

    // Compute cooldown from stats
    const shootComputed = game.getComputedStats();
    const shootDexStat = shootComputed ? shootComputed.dex : 10;
    let shootDex = Math.floor((6.5 * (shootDexStat + 17.3)) / 75);
    const shootEffects = game.effectIds || [];
    if (shootEffects.some(id => id === 4)) shootDex = Math.floor(shootDex * 1.5);
    if (shootEffects.some(id => id === 11)) shootDex = 1;
    const shootCooldownMs = 1000 / Math.max(shootDex, 1) + 10;
    const canShoot = (performance.now() - game._lastShotTime) > shootCooldownMs;

    if (wantsShoot && !isMouseOverHud && canShoot && renderer) {
        let world;
        if (aim && aim.shooting) {
            // Aim joystick: project direction from player position
            const local = game.getLocalPlayer();
            if (local) {
                world = { x: local.pos.x + aim.dx * 300, y: local.pos.y + aim.dy * 300 };
            } else {
                world = { x: 0, y: 0 };
            }
        } else {
            world = renderer.getWorldCoords(input.mouseX, input.mouseY, game);
        }
        const local = game.getLocalPlayer();
        if (local) {
            // Determine attack animation from aim direction relative to player
            const relX = world.x - local.pos.x;
            const relY = world.y - local.pos.y;
            if (Math.abs(relX) > Math.abs(relY)) {
                game.shootingAnim = 'attack_side';
                // Flip sprite to face aim direction
                local.facing = relX < 0 ? 'left' : 'right';
            } else if (relY > 0) {
                game.shootingAnim = 'attack_down';
            } else {
                game.shootingAnim = 'attack_up';
            }
            game.shootingAnimTimer = 0.3; // hold attack anim; refreshes each shot
            const weapon = game.inventory.length > 0 ? game.inventory[0] : null;
            const projGroupId = weapon ? weapon.damage.projectileGroupId : 0;
            network.sendShoot(
                ++projectileCounter, game.playerId, projGroupId,
                world.x, world.y, local.pos.x, local.pos.y
            );
            game._lastShotTime = performance.now();
        }
    }

    // Ability (right click)
    if (input.wantsAbility() && !isMouseOverHud && renderer) {
        const world = renderer.getWorldCoords(input.mouseX, input.mouseY, game);
        network.sendUseAbility(game.playerId, world.x, world.y);
    }

    // ESC = Return to character select (disconnect and switch character)
    if (input.isKeyDown('Escape')) {
        input.keys['Escape'] = false;
        returnToCharacterSelect();
        return;
    }

    // I = Toggle autofire
    if (input.isKeyDown('KeyI') && !input.chatMode) {
        input.keys['KeyI'] = false;
        const on = input.toggleAutofire();
        addChatMessage('SYSTEM', on ? 'Autofire enabled' : 'Autofire disabled');
    }

    // F1 or R = Go to vault
    if (input.isKeyDown('F1') || (input.isKeyDown('KeyR') && !input.chatMode)) {
        input.keys['F1'] = false;
        input.keys['KeyR'] = false;
        doRealmTransition(null, true); // vault
    }

    // F2 = Use nearest portal
    if (input.isKeyDown('F2') || input.isKeyDown('KeyF') || input.isKeyDown('Space')) {
        input.keys['F2'] = false;
        input.keys['KeyF'] = false;
        input.keys['Space'] = false;
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
            if (item && item.itemId >= 0 && item.consumable) {
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

// --- Collision Check (matches Java TileManager.collisionTile exactly) ---
// Server uses: Rectangle(futurePos, size*0.85, size*0.85) at top-left corner
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

    // Hitbox: same as server (size * 0.85) at top-left of future position
    const hitSize = Math.floor(size * 0.85);
    const bx = futureX;
    const by = futureY;

    // Check collision tiles in 5x5 area around player center
    const cx = Math.floor((futureX + size / 2) / ts);
    const cy = Math.floor((futureY + size / 2) / ts);
    for (let ty = cy - 2; ty <= cy + 2; ty++) {
        for (let tx = cx - 2; tx <= cx + 2; tx++) {
            if (ty < 0 || ty >= game.mapHeight || tx < 0 || tx >= game.mapWidth) continue;
            const tile = game.mapTiles[ty]?.[tx];
            if (!tile || tile.collision <= 0) continue;
            const tileDef = game.tileData[tile.collision];
            if (!tileDef?.data?.hasCollision) continue;
            // AABB intersection (same as server Rectangle.intersect)
            const tl = tx * ts, tt = ty * ts;
            if (bx < tl + ts && bx + hitSize > tl && by < tt + ts && by + hitSize > tt) return true;
        }
    }

    // Void tile check
    if (cx >= 0 && cx < game.mapWidth && cy >= 0 && cy < game.mapHeight) {
        const baseTile = game.mapTiles[cy]?.[cx];
        if (baseTile && baseTile.base === 0) return true;
    }
    return false;
}

// --- Performance Overlay ---
let _perfEl = null;
function updatePerfOverlay() {
    if (!_perfEl || !_perfEl.parentNode) {
        _perfEl = document.createElement('div');
        _perfEl.id = 'perf-overlay';
        _perfEl.style.cssText = 'position:absolute;top:10px;left:10px;margin-top:28px;color:#aaa;font:11px monospace;z-index:11;pointer-events:none;text-shadow:1px 1px 2px #000;line-height:1.4;background:#1a1218cc;padding:4px 10px;border-radius:3px;';
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) gameScreen.appendChild(_perfEl);
        else document.body.appendChild(_perfEl);
    }
    const m = perfMetrics;
    const fpsColor = m.fps >= 55 ? '#6f6' : m.fps >= 30 ? '#ff6' : '#f66';
    const pingColor = m.ping < 50 ? '#6f6' : m.ping < 120 ? '#ff6' : '#f66';
    const memStr = m.memoryMB > 0 ? `MEM: ${m.memoryMB}MB<br>` : '';
    _perfEl.innerHTML =
        `FPS: <span style="color:${fpsColor}">${m.fps}</span><br>` +
        `${memStr}` +
        `PING: <span style="color:${pingColor}">${m.ping}ms</span><br>` +
        `JITTER: ${m.jitter}ms`;
}

// --- HUD Update ---
function updateHUD() {
    // Use computed stats (base + equipment bonuses) for display
    const computed = game.getComputedStats();

    // Player identity header: Name Lv. X ClassName
    const level = game.getPlayerLevel();
    const className = CLASS_NAMES[game.classId] || 'Unknown';
    const pName = game.playerName || 'Player';
    const identityEl = document.getElementById('player-identity');
    if (identityEl) {
        identityEl.textContent = `${pName}  Lv. ${level}  ${className}`;
    }

    // HP bar - max HP from computed stats
    const maxHp = computed ? computed.hp : game.maxHealth;
    const hpPct = maxHp > 0 ? Math.min(100, game.health / maxHp * 100) : 100;
    // Check max stats for gold highlighting
    const maxStats = game.getMaxStats();
    const isMaxed = (stat, val) => maxStats && val >= maxStats[stat];

    const hpSpan = document.getElementById('hp-text');
    hpSpan.textContent = `${game.health}/${maxHp}`;
    hpSpan.style.color = isMaxed('hp', game.stats?.hp) ? '#c8a86e' : '#fff';
    document.getElementById('hp-bar').style.width = `${hpPct}%`;

    // MP bar
    const maxMp = computed ? computed.mp : game.maxMana;
    const mpPct = maxMp > 0 ? Math.min(100, game.mana / maxMp * 100) : 100;
    const mpSpan = document.getElementById('mp-text');
    mpSpan.textContent = `${game.mana}/${maxMp}`;
    mpSpan.style.color = isMaxed('mp', game.stats?.mp) ? '#c8a86e' : '#fff';
    document.getElementById('mp-bar').style.width = `${mpPct}%`;

    // XP/Level/Fame bar
    const expInfo = game.getExpDisplayInfo();
    document.getElementById('xp-text').textContent = expInfo.text;
    document.getElementById('xp-bar').style.width = `${expInfo.pct}%`;
    // Gold bar for fame, green for XP
    document.getElementById('xp-bar').style.background = expInfo.isFame ? '#c8a86e' : '#40a040';

    // Stats panel — gold text when stat is maxed for class
    if (computed) {
        const base = game.stats;
        const statHtml = (label, statKey, baseVal, compVal) => {
            const bonus = compVal - baseVal;
            const bonusStr = bonus > 0 ? ` <span class="stat-bonus">+${bonus}</span>` : '';
            const maxed = isMaxed(statKey, baseVal);
            const color = maxed ? 'color:#c8a86e' : '';
            return `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value" style="${color}">${compVal}${bonusStr}${maxed ? ' ★' : ''}</span></div>`;
        };
        document.getElementById('stats-panel').innerHTML =
            statHtml('ATT', 'att', base.att, computed.att) +
            statHtml('DEF', 'def', base.def, computed.def) +
            statHtml('SPD', 'spd', base.spd, computed.spd) +
            statHtml('DEX', 'dex', base.dex, computed.dex) +
            statHtml('VIT', 'vit', base.vit, computed.vit) +
            statHtml('WIS', 'wis', base.wis, computed.wis);
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

    // Portal proximity prompt — show "Enter [Dungeon Name]" when near a portal
    const portalPrompt = document.getElementById('portal-prompt');
    const local = game.getLocalPlayer();
    if (local && game.portals.size > 0) {
        let nearPortal = null, nearDist = Infinity;
        for (const [id, portal] of game.portals) {
            const pdx = portal.pos.x - local.pos.x, pdy = portal.pos.y - local.pos.y;
            const d = Math.sqrt(pdx * pdx + pdy * pdy);
            if (d < nearDist) { nearDist = d; nearPortal = portal; }
        }
        if (nearPortal && nearDist < 64) {
            const portalDef = game.portalData[nearPortal.portalId];
            const name = portalDef ? portalDef.portalName || 'Portal' : 'Portal';
            document.getElementById('portal-name').textContent = name.replace(/_/g, ' ');
            portalPrompt.style.display = 'flex';
        } else {
            portalPrompt.style.display = 'none';
        }
    } else {
        portalPrompt.style.display = 'none';
    }
}

// --- Inventory System ---
let selectedSlot = -1; // Currently selected slot for swap (-1 = none)
let lastInvKey = '';
let isMouseOverHud = false; // Prevents shooting/ability when hovering over UI
let dragSlot = -1; // Slot being dragged (-1 = none)
let dragEl = null; // Floating drag element
let lastLootKey = '';
let lastTouchTime = 0; // Tracks recent touch events to filter synthetic mouse events
// Sprite data URL cache to avoid re-extracting every frame
const spriteCache = {};

function getItemSpriteUrl(item) {
    if (!item || item.itemId < 0 || !renderer) return null;
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
        // Inventory log removed for performance
    }
    // Include trade selection state in cache key during trading
    const tradeKey = game.isTrading && game.myTradeSelected
        ? ':t:' + game.myTradeSelected.join(',') : '';
    const fullKey = invKey + tradeKey;
    if (lastInvKey === fullKey) { updateGroundLootUI(); return; }
    lastInvKey = fullKey;

    // Update labels for trade mode
    document.getElementById('inv-label').textContent =
        game.isTrading ? 'YOUR OFFER (click to select)' : 'INVENTORY';

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

    // During trading, show partner's full inventory with selection highlights
    if (game.isTrading) {
        lootPanel.style.display = 'block';
        document.querySelector('#ground-loot-panel h4').textContent =
            `${game.tradePartnerName}'s Items`;

        // Get partner's selection state from server
        const partnerSel = game.getPartnerTradeSelection();
        const partnerSelected = partnerSel?.selection || [];
        // Use partner inventory from AcceptTradePacket
        const partnerInv = game.tradePartnerInv || [];

        const tradeKey = 'trade:' + partnerInv.map((it, i) =>
            (partnerSelected[i] ? '*' : '') + (it ? it.itemId : 0)).join(',');
        if (lastLootKey === tradeKey) return;
        lastLootKey = tradeKey;

        lootEl.innerHTML = '';
        // Show partner's inventory slots 4-11 (their backpack, not equipment)
        for (let i = 0; i < 8; i++) {
            const item = partnerInv[i + 4]; // Slots 4-11 of partner's inventory
            const div = document.createElement('div');
            div.className = 'inv-slot loot-slot';
            // Highlight items the partner has SELECTED for trade
            if (partnerSelected[i]) div.classList.add('trade-selected');

            if (item && item.itemId >= 0) {
                const tooltip = game.getItemTooltip(item);
                if (tooltip) div.title = tooltip;
                const spriteUrl = getItemSpriteUrl(item);
                if (spriteUrl) {
                    const img = document.createElement('img');
                    img.src = spriteUrl;
                    div.appendChild(img);
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
            lbl.textContent = `${i + 1}`;
            div.appendChild(lbl);
            lootEl.appendChild(div);
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
    div.dataset.slotIdx = slotIdx;
    if (slotIdx === selectedSlot) div.classList.add('selected');

    // Trade selection highlight — use local tracking
    if (game.isTrading && slotIdx >= 4 && slotIdx <= 11 && game.myTradeSelected) {
        if (game.myTradeSelected[slotIdx - 4]) {
            div.classList.add('trade-selected');
        }
    }

    if (item && item.itemId >= 0) {
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

    // Click / double-tap: single click = select/swap, double click/tap = consume
    let lastClickTime = 0;
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        // Skip click if we just finished a drag
        if (dragSlot >= 0) return;
        const now = Date.now();
        if (now - lastClickTime < 350 && item && item.itemId >= 0 && item.consumable
            && slotIdx >= 4 && slotIdx <= 11) {
            // Double click/tap — consume the item
            network.sendMoveItem(game.playerId, slotIdx, slotIdx, false, true);
            lastInvKey = '';
            lastClickTime = 0;
            return;
        }
        lastClickTime = now;
        onSlotClick(slotIdx, item);
    });
    // Right click (desktop) = drop
    div.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); onSlotRightClick(slotIdx, item); });

    // Drag start (desktop only - skip on touch devices to not interfere with taps)
    div.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // left click only
        // Skip if this is a touch-originated mouse event
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
        // Fallback: skip if we've seen a recent touch event (within 500ms)
        if (Date.now() - lastTouchTime < 500) return;
        if (item && item.itemId >= 0) {
            e.preventDefault();
            startDrag(slotIdx, item, e);
        }
    });

    // Touch-based drag start (with hold delay to distinguish from tap)
    let touchHoldTimer = null;
    div.addEventListener('touchstart', (e) => {
        lastTouchTime = Date.now();
        if (!item || item.itemId < 0) return;
        const touch = e.touches[0];
        touchHoldTimer = setTimeout(() => {
            startDrag(slotIdx, item, { clientX: touch.clientX, clientY: touch.clientY });
        }, 300); // Start drag after 300ms hold
    }, { passive: true });

    div.addEventListener('touchend', () => {
        if (touchHoldTimer) { clearTimeout(touchHoldTimer); touchHoldTimer = null; }
    });

    div.addEventListener('touchmove', () => {
        if (touchHoldTimer) { clearTimeout(touchHoldTimer); touchHoldTimer = null; }
    }, { passive: true });

    return div;
}

// Empty item placeholder (matches server's empty slot representation)
const EMPTY_ITEM = { itemId: 0, uid: '', name: '', description: '',
    stats: {hp:0,mp:0,def:0,att:0,spd:0,dex:0,vit:0,wis:0},
    damage: {projectileGroupId:0,min:0,max:0},
    effect: {self:false,effectId:0,duration:0n,cooldownDuration:0n,mpCost:0},
    consumable: false, tier: -1, targetSlot: 0, targetClass: -1, fameBonus: 0 };

function onSlotClick(slotIdx, item, isRightClick = false) {
    // During trading, clicking inventory slots 4-11 toggles trade selection
    if (game.isTrading && slotIdx >= 4 && slotIdx <= 11) {
        toggleTradeSelection(slotIdx);
        return;
    }

    // Ground loot: single click = pick up to first empty inv slot
    if (slotIdx >= 20 && slotIdx <= 27 && item && item.itemId >= 0) {
        // console.log(`[INV] Picking up from ground slot ${slotIdx}, itemId=${item.itemId}`);
        // Send with target=4 (first inv slot) so server's isInv1 check passes
        // Server will use firstEmptyInvSlot() regardless
        network.sendMoveItem(game.playerId, 4, slotIdx, false, false);
        lastInvKey = ''; lastLootKey = '';
        return;
    }

    if (selectedSlot === -1) {
        // Nothing selected - select this slot if it has an item
        if (item && item.itemId >= 0) {
            selectedSlot = slotIdx;
            lastInvKey = '';
        }
    } else {
        if (slotIdx === selectedSlot) {
            selectedSlot = -1; // Deselect
        } else if (selectedSlot >= 0 && selectedSlot <= 11 && slotIdx >= 0 && slotIdx <= 11) {
            // Swap/equip/move between slots 0-11
            // console.log(`[INV] Swap slot ${selectedSlot} <-> slot ${slotIdx}`);
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
    if (item && item.itemId >= 0 && slotIdx >= 0 && slotIdx <= 11) {
        // console.log(`[INV] Dropping item from slot ${slotIdx}`);
        network.sendMoveItem(game.playerId, -1, slotIdx, true, false);
        lastInvKey = '';
    }
}

function toggleTradeSelection(slotIdx) {
    if (!game.myTradeSelected) game.myTradeSelected = new Array(8).fill(false);
    const selIdx = slotIdx - 4;
    if (selIdx < 0 || selIdx >= 8) return;

    // Toggle selection
    game.myTradeSelected[selIdx] = !game.myTradeSelected[selIdx];
    game.tradeConfirmed = false;

    // Send UpdatePlayerTradeSelectionPacket to server
    network.send(PacketWriters.tradeSelection(game.playerId, game.myTradeSelected));
    lastInvKey = ''; lastLootKey = '';
}

// Drop selected item when clicking game canvas (outside inventory)
document.getElementById('game-canvas-container').addEventListener('click', () => {
    // Blur chat input when clicking on game canvas — returns keyboard to game
    document.getElementById('chat-input').blur();
    if (selectedSlot >= 0 && selectedSlot <= 11 && currentScreen === 'game') {
        // console.log(`[INV] Dropping item from slot ${selectedSlot} (canvas click)`);
        network.sendMoveItem(game.playerId, -1, selectedSlot, true, false);
        selectedSlot = -1;
        lastInvKey = '';
    }
});

// --- HUD hover detection (blocks shooting/ability over UI) ---
document.getElementById('hud').addEventListener('mouseenter', () => { isMouseOverHud = true; });
document.getElementById('hud').addEventListener('mouseleave', () => { isMouseOverHud = false; });
document.getElementById('chat-panel').addEventListener('mouseenter', () => { isMouseOverHud = true; });
document.getElementById('chat-panel').addEventListener('mouseleave', () => { isMouseOverHud = false; });

// --- Drag and Drop for inventory slots ---
function startDrag(slotIdx, item, e) {
    if (!item || item.itemId < 0) return;
    dragSlot = slotIdx;
    selectedSlot = -1;

    dragEl = document.createElement('div');
    dragEl.className = 'inv-slot dragging';
    dragEl.style.cssText = 'position:fixed;pointer-events:none;z-index:200;opacity:0.8;width:40px;height:40px;';
    const spriteUrl = getItemSpriteUrl(item);
    if (spriteUrl) {
        const img = document.createElement('img');
        img.src = spriteUrl;
        img.style.cssText = 'width:100%;height:100%;image-rendering:pixelated;';
        dragEl.appendChild(img);
    }
    document.body.appendChild(dragEl);
    moveDrag(e);
}

function moveDrag(e) {
    if (!dragEl) return;
    dragEl.style.left = (e.clientX - 20) + 'px';
    dragEl.style.top = (e.clientY - 20) + 'px';
}

function endDrag(e) {
    if (dragSlot < 0 || !dragEl) { cleanupDrag(); return; }

    // Find which slot we dropped on
    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    const slotEl = dropTarget ? dropTarget.closest('.inv-slot') : null;
    const targetIdx = slotEl ? parseInt(slotEl.dataset.slotIdx) : -1;

    if (targetIdx >= 0 && targetIdx !== dragSlot && targetIdx <= 27) {
        if (targetIdx >= 20) {
            // Drop to ground
            network.sendMoveItem(game.playerId, -1, dragSlot, true, false);
        } else {
            // Swap between inventory/equipment slots
            network.sendMoveItem(game.playerId, targetIdx, dragSlot, false, false);
        }
        lastInvKey = ''; lastLootKey = '';
    }

    cleanupDrag();
}

function cleanupDrag() {
    dragSlot = -1;
    if (dragEl) { dragEl.remove(); dragEl = null; }
}

document.addEventListener('mousemove', moveDrag);
document.addEventListener('mouseup', endDrag);

// Touch event handlers for drag operations (ensures cleanup on mobile)
document.addEventListener('touchmove', (e) => {
    if (dragSlot < 0 || !dragEl) return;
    const touch = e.touches[0];
    if (touch) moveDrag({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (dragSlot < 0) return;
    const touch = e.changedTouches[0];
    if (touch) {
        endDrag({ clientX: touch.clientX, clientY: touch.clientY });
    } else {
        cleanupDrag();
    }
});

document.addEventListener('touchcancel', cleanupDrag);

// --- Chat ---
const CHAT_ROLE_COLORS = {
    'sysadmin': '#ff6644',
    'admin':    '#cc66ff',
    'mod':      '#44dddd',
};
const CHAT_NAME_COLORS = {
    'SYSTEM':   '#c8a86e',
    'Overseer': '#e8c840',
};
const DEFAULT_NAME_COLOR = '#80b0e0';

function getNameColor(from, role) {
    if (CHAT_NAME_COLORS[from]) return CHAT_NAME_COLORS[from];
    if (role && CHAT_ROLE_COLORS[role]) return CHAT_ROLE_COLORS[role];
    return DEFAULT_NAME_COLOR;
}

function addChatMessage(from, message, role) {
    const el = document.getElementById('chat-messages');
    const div = document.createElement('div');
    if (from === 'SYSTEM') {
        div.className = 'msg-system';
        div.textContent = message;
    } else {
        div.className = 'msg-player';
        const color = getNameColor(from, role);
        const nameSpan = `<span class="msg-name" style="color:${color}">[${escapeHtml(from)}]</span>`;
        div.innerHTML = `${nameSpan}: ${escapeHtml(message)}`;
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
// Click anywhere outside chat = return focus to game
document.getElementById('hud').addEventListener('mousedown', (e) => {
    if (e.target !== chatInput) chatInput.blur();
});
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

// Position joystick sticky above chat panel
function repositionJoystick() {
    const joystick = document.getElementById('touch-joystick');
    const panel = document.getElementById('chat-panel');
    if (joystick && panel) {
        const chatRect = panel.getBoundingClientRect();
        joystick.style.bottom = (window.innerHeight - chatRect.top + 4) + 'px';
    }
}

// Chat toggle button
document.getElementById('chat-toggle').addEventListener('click', () => {
    const panel = document.getElementById('chat-panel');
    panel.classList.toggle('collapsed');
    requestAnimationFrame(repositionJoystick);
});

// Position joystick on load and resize
repositionJoystick();
window.addEventListener('resize', repositionJoystick);

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

// --- Mobile Action Buttons ---
document.getElementById('mobile-ability-btn')?.addEventListener('click', () => {
    if (!game.playerId || !renderer) return;
    const local = game.getLocalPlayer();
    if (!local) return;
    // Use ability toward the center of screen (default target)
    const world = renderer.getWorldCoords(window.innerWidth / 2, window.innerHeight / 2, game);
    network.sendUseAbility(game.playerId, world.x, world.y);
});

document.getElementById('mobile-vault-btn')?.addEventListener('click', () => {
    if (!game.playerId) return;
    doRealmTransition(null, true);
});

// --- View Mode Toggle (mobile/desktop) ---
// Use the same detection logic as renderer.js and touch.js to determine current mode.
// Cannot rely on joystick DOM state — it's set later during network setup.
function isCurrentlyMobile() {
    const override = localStorage.getItem('openrealm_viewmode');
    if (override === 'mobile') return true;
    if (override === 'desktop') return false;
    const smallScreen = window.innerWidth < 900 && window.innerHeight < 600;
    const mobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    return smallScreen || mobileUA;
}
const viewToggle = document.getElementById('viewmode-toggle');
if (viewToggle) {
    const mobileNow = isCurrentlyMobile();
    viewToggle.textContent = mobileNow ? 'Desktop View' : 'Mobile View';
    viewToggle.addEventListener('click', () => {
        localStorage.setItem('openrealm_viewmode', mobileNow ? 'desktop' : 'mobile');
        window.location.reload();
    });
}

document.getElementById('portal-enter-btn')?.addEventListener('click', () => {
    if (!game.playerId) return;
    const local = game.getLocalPlayer();
    if (!local) return;
    let closest = null, closestDist = Infinity;
    for (const [id, portal] of game.portals) {
        const pdx = portal.pos.x - local.pos.x, pdy = portal.pos.y - local.pos.y;
        const d = Math.sqrt(pdx * pdx + pdy * pdy);
        if (d < closestDist) { closestDist = d; closest = portal; }
    }
    if (closest && closestDist < 64) {
        doRealmTransition(closest, false);
    }
});

// --- Init ---
showScreen('login');
