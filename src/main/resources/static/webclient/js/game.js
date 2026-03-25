// Game state management - entities, map, player data, trading, damage text

export const CLASS_NAMES = ['Rogue', 'Archer', 'Wizard', 'Priest', 'Warrior', 'Knight', 'Paladin'];

export class GameState {
    constructor() {
        this.playerId = null;
        this.playerName = '';
        this.classId = 0;

        // Entities keyed by ID (BigInt)
        this.players = new Map();
        this.enemies = new Map();
        this.bullets = new Map();
        this.lootContainers = new Map();
        this.portals = new Map();

        // Map data
        this.mapTiles = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.mapId = 0;
        this.realmId = null;

        // Player stats
        this.stats = null;
        this.health = 0;
        this.maxHealth = 0;
        this.mana = 0;
        this.maxMana = 0;
        this.experience = 0;
        this.inventory = [];
        this.effectIds = [];
        this.effectTimes = [];

        // Camera
        this.cameraX = 0;
        this.cameraY = 0;

        // Realm transition
        this.awaitingRealmTransition = false;

        // Chat
        this.chatMessages = [];

        // Trading
        this.isTrading = false;
        this.tradePartnerName = '';
        this.tradeSelection = null; // NetTradeSelection {player0Selection, player1Selection}
        this.tradeConfirmed = false;

        // Floating damage text
        this.damageTexts = []; // {text, x, y, color, life}

        // Game data definitions (loaded from HTTP)
        this.tileData = {};
        this.enemyData = {};
        this.itemData = {};
        this.characterClasses = {};
        this.portalData = {};
        this.projectileGroups = {};
        this.expLevels = null;
    }

    getLocalPlayer() {
        return this.players.get(this.playerId);
    }

    // Clear state for realm transition (matches Java Realm.loadMap)
    prepareRealmTransition() {
        this.bullets.clear();
        this.enemies.clear();
        this.lootContainers.clear();
        this.portals.clear();
        // Keep players (local player persists across realms)
        // Clear map - will be filled by incoming LoadMapPacket
        this.mapTiles = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.awaitingRealmTransition = true;
    }

    // Computed stats = base stats + equipment bonuses (slots 0-3)
    // Matches Java Player.getComputedStats()
    getComputedStats() {
        if (!this.stats) return null;
        const s = { ...this.stats };
        for (let i = 0; i < 4; i++) {
            const item = this.inventory[i];
            if (item && item.itemId > 0 && item.stats) {
                s.hp += item.stats.hp || 0;
                s.mp += item.stats.mp || 0;
                s.def += item.stats.def || 0;
                s.att += item.stats.att || 0;
                s.spd += item.stats.spd || 0;
                s.dex += item.stats.dex || 0;
                s.vit += item.stats.vit || 0;
                s.wis += item.stats.wis || 0;
            }
        }
        return s;
    }

    // Get item definition with all sprite/stat info
    getItemDef(itemId) {
        return this.itemData[itemId] || null;
    }

    // Build tooltip text for an item
    getItemTooltip(item) {
        if (!item || item.itemId <= 0) return null;
        const def = this.getItemDef(item.itemId) || {};
        const lines = [];
        lines.push(item.name || def.name || 'Unknown Item');
        if (item.description || def.description) lines.push(item.description || def.description);
        if (item.tier >= 0) lines.push(`Tier ${item.tier}`);
        if (item.damage && (item.damage.min > 0 || item.damage.max > 0)) {
            lines.push(`Damage: ${item.damage.min}-${item.damage.max}`);
        }
        const s = item.stats;
        if (s) {
            const statNames = ['HP','MP','DEF','ATT','SPD','DEX','VIT','WIS'];
            const vals = [s.hp, s.mp, s.def, s.att, s.spd, s.dex, s.vit, s.wis];
            const bonuses = vals.map((v, i) => v !== 0 ? `${v > 0 ? '+' : ''}${v} ${statNames[i]}` : null).filter(Boolean);
            if (bonuses.length) lines.push(bonuses.join(', '));
        }
        if (item.consumable) lines.push('Consumable');
        const cls = item.targetClass;
        if (cls >= 0 && cls < CLASS_NAMES.length) lines.push(`Class: ${CLASS_NAMES[cls]}`);
        return lines.join('\n');
    }

    handleLoadMap(packet) {
        const sameMap = this.mapTiles && this.realmId === packet.realmId && this.mapId === packet.mapId;
        this.realmId = packet.realmId;
        this.mapId = packet.mapId;
        this.mapWidth = packet.mapWidth;
        this.mapHeight = packet.mapHeight;

        if (!sameMap) {
            this.mapTiles = [];
            for (let r = 0; r < this.mapHeight; r++) {
                this.mapTiles[r] = [];
                for (let c = 0; c < this.mapWidth; c++) {
                    this.mapTiles[r][c] = { base: -1, collision: -1 };
                }
            }
        }

        let baseCount = 0, collCount = 0, outOfBounds = 0;
        for (const tile of packet.tiles) {
            // Server swaps x/y: new NetTile(id, layer, y, x) → xIndex=row, yIndex=col
            const r = tile.xIndex;
            const c = tile.yIndex;
            if (r >= 0 && r < this.mapHeight && c >= 0 && c < this.mapWidth) {
                if (tile.layer === 0) { this.mapTiles[r][c].base = tile.tileId; baseCount++; }
                else { this.mapTiles[r][c].collision = tile.tileId; collCount++; }
            } else { outOfBounds++; }
        }
        if (baseCount > 0 || collCount > 0 || outOfBounds > 0) {
            console.log(`[MAP] mapId=${this.mapId} ${this.mapWidth}x${this.mapHeight}: ` +
                `${baseCount} base + ${collCount} coll tiles loaded (${outOfBounds} OOB, sameMap=${sameMap})`);
        }
    }

    handleLoad(packet) {
        for (const p of packet.players) {
            if (p.id === this.playerId) {
                // Update existing local player data, don't overwrite position (prediction handles that)
                const existing = this.players.get(p.id);
                if (existing) {
                    existing.targetX = p.pos.x;
                    existing.targetY = p.pos.y;
                    existing.classId = p.classId;
                    existing.name = p.name;
                    existing.size = p.size || 32;
                    continue;
                }
            }
            this.players.set(p.id, {
                ...p, dx: p.dX, dy: p.dY,
                targetX: p.pos.x, targetY: p.pos.y,
                animFrame: 0, animTimer: 0, facing: 'right'
            });
        }
        for (const e of packet.enemies) {
            this.enemies.set(e.id, {
                ...e, dx: e.dX, dy: e.dY,
                targetX: e.pos.x, targetY: e.pos.y,
                animFrame: 0, animTimer: 0
            });
        }
        for (const b of packet.bullets) {
            this.bullets.set(b.id, {
                ...b, dx: b.dX, dy: b.dY,
                targetX: b.pos.x, targetY: b.pos.y
            });
        }
        for (const c of packet.containers) {
            // Always replace - server sends updated container with new items
            this.lootContainers.set(c.lootContainerId, c);
        }
        for (const p of packet.portals) {
            this.portals.set(p.id, p);
        }
    }

    handleUnload(packet) {
        for (const id of packet.players) this.players.delete(id);
        for (const id of packet.bullets) this.bullets.delete(id);
        for (const id of packet.enemies) this.enemies.delete(id);
        for (const id of packet.containers) this.lootContainers.delete(id);
        for (const id of packet.portals) this.portals.delete(id);
    }

    handleObjectMove(packet) {
        for (const mov of packet.movements) {
            const t = mov.entityType, id = mov.entityId;
            if (t === 0) {
                const p = this.players.get(id);
                if (p) {
                    if (id === this.playerId && this.awaitingRealmTransition) {
                        // Snap position during realm transition (no lerp)
                        p.pos.x = mov.posX; p.pos.y = mov.posY;
                        p.targetX = mov.posX; p.targetY = mov.posY;
                        this.cameraX = mov.posX; this.cameraY = mov.posY;
                        this.awaitingRealmTransition = false;
                        console.log(`[REALM] Transition complete, snapped to (${mov.posX}, ${mov.posY})`);
                    } else {
                        p.targetX = mov.posX; p.targetY = mov.posY;
                    }
                    p.dx = mov.velX; p.dy = mov.velY;
                }
            } else if (t === 1) {
                const e = this.enemies.get(id);
                if (e) { e.pos.x = mov.posX; e.pos.y = mov.posY; e.targetX = mov.posX; e.targetY = mov.posY; e.dx = mov.velX; e.dy = mov.velY; }
            } else if (t === 2) {
                const b = this.bullets.get(id);
                if (b) { b.targetX = mov.posX; b.targetY = mov.posY; b.dx = mov.velX; b.dy = mov.velY; }
            }
        }
    }

    handleUpdate(packet) {
        const isLocal = packet.playerId === this.playerId;
        if (isLocal) {
            this.stats = packet.stats;
            this.health = packet.health;
            this.maxHealth = packet.stats.hp;
            this.mana = packet.mana;
            this.maxMana = packet.stats.mp;
            this.experience = packet.experience;
            this.inventory = packet.inventory;
            this.effectIds = packet.effectIds;
            this.effectTimes = packet.effectTimes;
            this.playerName = packet.playerName;
        }
        const player = this.players.get(packet.playerId);
        if (player) {
            player.name = packet.playerName;
            player.health = packet.health;
            player.maxHealth = packet.stats.hp;
            player.stats = packet.stats;
        }
        const enemy = this.enemies.get(packet.playerId);
        if (enemy) { enemy.health = packet.health; }
    }

    handleText(packet) {
        this.chatMessages.push({ from: packet.from, to: packet.to, message: packet.message, time: Date.now() });
        if (this.chatMessages.length > 50) this.chatMessages.shift();
    }

    handleTextEffect(packet) {
        // Find target entity position for floating text
        let x = 0, y = 0;
        const entityType = packet.entityType;
        const targetId = packet.targetEntityId;
        if (entityType === 0) {
            const p = this.players.get(targetId);
            if (p) { x = p.pos.x; y = p.pos.y; }
        } else if (entityType === 1) {
            const e = this.enemies.get(targetId);
            if (e) { x = e.pos.x; y = e.pos.y; }
        } else if (entityType === 2) {
            const b = this.bullets.get(targetId);
            if (b) { x = b.pos.x; y = b.pos.y; }
        }
        // Color by text effect type: 0=damage(red), 1=heal(green), 2=armor(blue), 3=env(blue), 4=info(orange)
        const colors = [0xff4040, 0x40ff40, 0x4080ff, 0x4080ff, 0xff8040];
        const color = colors[packet.textEffectId] || 0xffffff;
        this.damageTexts.push({ text: packet.text, x, y, color, life: 45 });
    }

    // Trading
    handleRequestTrade(packet) {
        this.chatMessages.push({
            from: 'SYSTEM', to: '', time: Date.now(),
            message: `${packet.requestingPlayerName} has proposed a trade. Type /accept to initiate.`
        });
    }

    handleAcceptTrade(packet) {
        if (packet.accepted) {
            this.isTrading = true;
            // Determine partner name
            const p0 = packet.player0;
            const p1 = packet.player1;
            if (p0 && p1) {
                this.tradePartnerName = (p0.id === this.playerId) ? p1.name : p0.name;
            }
        } else {
            this.isTrading = false;
            this.tradePartnerName = '';
            this.tradeSelection = null;
            this.tradeConfirmed = false;
        }
    }

    handleUpdateTrade(packet) {
        this.tradeSelection = packet.selections;
    }

    handleUpdateTradeSelection(packet) {
        if (!this.tradeSelection) return;
        const sel = packet.selection;
        // Update the matching player's selection
        if (this.tradeSelection.player0Selection &&
            sel.playerId === this.tradeSelection.player0Selection.playerId) {
            this.tradeSelection.player0Selection = sel;
        } else if (this.tradeSelection.player1Selection) {
            this.tradeSelection.player1Selection = sel;
        }
    }

    getMyTradeSelection() {
        if (!this.tradeSelection) return null;
        if (this.tradeSelection.player0Selection?.playerId === this.playerId)
            return this.tradeSelection.player0Selection;
        return this.tradeSelection.player1Selection;
    }

    getPartnerTradeSelection() {
        if (!this.tradeSelection) return null;
        if (this.tradeSelection.player0Selection?.playerId === this.playerId)
            return this.tradeSelection.player1Selection;
        return this.tradeSelection.player0Selection;
    }

    updateInterpolation(dt) {
        // Server sends authoritative positions via ObjectMovePacket → targetX/targetY.
        // Local player: high lerp (0.55) for snappy feel without client-side prediction.
        // Other players: moderate lerp (0.45) for smooth interpolation.
        const SELF_LERP = 0.55;
        const OTHER_LERP = 0.45;
        const SNAP_DISTANCE = 96;

        for (const [id, p] of this.players) {
            const lerp = id === this.playerId ? SELF_LERP : OTHER_LERP;
            const dx = p.targetX - p.pos.x, dy = p.targetY - p.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > SNAP_DISTANCE) { p.pos.x = p.targetX; p.pos.y = p.targetY; }
            else { p.pos.x += dx * lerp; p.pos.y += dy * lerp; }
            if (Math.abs(p.dx) > 0.1) p.facing = p.dx > 0 ? 'right' : 'left';
            p.animTimer = (p.animTimer || 0) + dt;
            if (p.animTimer > 0.125) { p.animTimer = 0; p.animFrame = ((p.animFrame || 0) + 1) % 2; }
        }
        // Bullets: fully client-predicted (server no longer sends ObjectMovePacket for bullets).
        // Trajectory is deterministic: velocity = (sin(angle)*magnitude, cos(angle)*magnitude).
        // Remove bullets that exceed their range or lifetime (10 sec).
        const now = Date.now();
        for (const [id, b] of this.bullets) {
            const vx = Math.sin(b.angle) * b.magnitude;
            const vy = Math.cos(b.angle) * b.magnitude;
            b.pos.x += vx;
            b.pos.y += vy;

            // Track distance traveled for range check
            b._traveled = (b._traveled || 0) + b.magnitude;
            const lifetime = now - Number(b.createdTime);
            if (b._traveled > b.range || lifetime > 10000) {
                this.bullets.delete(id);
            }
        }

        // Update damage texts
        for (let i = this.damageTexts.length - 1; i >= 0; i--) {
            this.damageTexts[i].y -= 1.4;
            this.damageTexts[i].life--;
            if (this.damageTexts[i].life <= 0) this.damageTexts.splice(i, 1);
        }

        const local = this.getLocalPlayer();
        if (local) {
            this.cameraX += (local.pos.x - this.cameraX) * 0.35;
            this.cameraY += (local.pos.y - this.cameraY) * 0.35;
        }
    }

    getNearbyLootContainer(maxDist = 128) {
        const local = this.getLocalPlayer();
        if (!local) return null;
        let closest = null, closestDist = Infinity;
        for (const [id, loot] of this.lootContainers) {
            const dx = loot.pos.x - local.pos.x, dy = loot.pos.y - local.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist && dist < maxDist) { closestDist = dist; closest = loot; }
        }
        return closest;
    }

    // Get nearby players (excluding self) for the players list
    getNearbyPlayers(max = 16) {
        const result = [];
        for (const [id, p] of this.players) {
            if (id === this.playerId) continue;
            result.push(p);
            if (result.length >= max) break;
        }
        return result;
    }

    // Parse exp level ranges into {level: {min, max}} on first call
    _getParsedExpMap() {
        if (this._parsedExpMap) return this._parsedExpMap;
        if (!this.expLevels || !this.expLevels.levelExperienceMap) return null;
        this._parsedExpMap = {};
        this._maxExpLevel = 1;
        this._maxExperience = 0;
        for (const [lvl, range] of Object.entries(this.expLevels.levelExperienceMap)) {
            const [min, max] = range.split('-').map(Number);
            const l = parseInt(lvl);
            this._parsedExpMap[l] = { min, max };
            if (l > this._maxExpLevel) this._maxExpLevel = l;
            if (max > this._maxExperience) this._maxExperience = max;
        }
        return this._parsedExpMap;
    }

    // Matches Java ExperienceModel.getLevel()
    getPlayerLevel() {
        const map = this._getParsedExpMap();
        if (!map) return 1;
        const exp = Number(this.experience);
        if (exp > this._maxExperience) return this._maxExpLevel;
        let level = 1;
        for (const [lvl, range] of Object.entries(map)) {
            if (range.min <= exp && range.max >= exp) {
                level = parseInt(lvl);
            }
        }
        return level;
    }

    // Matches Java ExperienceModel.getBaseFame()
    getBaseFame() {
        const exp = Number(this.experience);
        if (exp > this._maxExperience) {
            return Math.floor((exp - this._maxExperience) / 2500);
        }
        return 0;
    }

    // Get XP bar display info matching Java FillBars
    getExpDisplayInfo() {
        const map = this._getParsedExpMap();
        if (!map) return { text: 'Lv 1', pct: 0 };
        const exp = Number(this.experience);
        const level = this.getPlayerLevel();
        const fame = this.getBaseFame();

        if (fame > 0) {
            // Max level reached - show fame
            return { text: `Fame: ${fame}`, pct: 100 };
        }

        // Show XP progress within current level
        const range = map[level];
        if (!range) return { text: `Lv ${level}`, pct: 0 };
        const pct = Math.min(100, (exp / range.max) * 100);
        return { text: `${exp} (${range.max})`, pct };
    }
}
