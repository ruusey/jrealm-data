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
        this.tradePartnerInv = null; // Partner's full inventory from AcceptTradePacket
        this.myTradeSelected = null; // Boolean[8] for our inventory slots 4-11
        this.tradeSelection = null;  // NetTradeSelection from server
        this.tradeConfirmed = false;

        // Floating damage text
        this.damageTexts = []; // {text, x, y, color, life}

        // Visual particle effects from CreateEffectPacket
        this.visualEffects = []; // {type, x, y, radius, duration, targetX, targetY, startTime}

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

    // Full reset for death/disconnect/character switch
    fullReset() {
        this.playerId = null;
        this.playerName = '';
        this.classId = 0;
        this.players.clear();
        this.enemies.clear();
        this.bullets.clear();
        this.lootContainers.clear();
        this.portals.clear();
        this.mapTiles = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.mapId = 0;
        this.realmId = null;
        this.stats = null;
        this.health = 0;
        this.maxHealth = 0;
        this.mana = 0;
        this.maxMana = 0;
        this.experience = 0;
        this.inventory = [];
        this.effectIds = [];
        this.effectTimes = [];
        this.cameraX = 0;
        this.cameraY = 0;
        this.awaitingRealmTransition = false;
        this.chatMessages = [];
        this.isTrading = false;
        this.tradePartnerName = '';
        this.tradePartnerInv = null;
        this.myTradeSelected = null;
        this.tradeSelection = null;
        this.tradeConfirmed = false;
        this.damageTexts = [];
        this.visualEffects = [];
        // Clear internal caches
        this._firstInvLog = false;
        this._parsedExpMap = null;
        this._maxExpLevel = 1;
        this._maxExperience = 0;
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
                        // Store snapshot for Hermite interpolation
                        if (!p._snapshots) p._snapshots = [];
                        p._snapshots.push({
                            x: mov.posX, y: mov.posY,
                            vx: mov.velX, vy: mov.velY,
                            t: Date.now()
                        });
                        // Keep only last 4 snapshots
                        if (p._snapshots.length > 4) p._snapshots.shift();
                    }
                    p.dx = mov.velX; p.dy = mov.velY;
                }
            } else if (t === 1) {
                const e = this.enemies.get(id);
                if (e) { e.targetX = mov.posX; e.targetY = mov.posY; e.dx = mov.velX; e.dy = mov.velY; }
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
            if (!this._firstInvLog) {
                this._firstInvLog = true;
                const ids = packet.inventory ? packet.inventory.map(i => i ? i.itemId : 'null') : [];
                console.log(`[INV] First UpdatePacket inventory: len=${packet.inventory?.length}, ids=[${ids.join(',')}]`);
            }
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
            player.effectIds = packet.effectIds;
        }
        const enemy = this.enemies.get(packet.playerId);
        if (enemy) {
            enemy.health = packet.health;
            enemy.effectIds = packet.effectIds;
        }
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

    addVisualEffect(effect) {
        this.visualEffects.push(effect);
    }

    updateVisualEffects() {
        const now = Date.now();
        for (let i = this.visualEffects.length - 1; i >= 0; i--) {
            if (now - this.visualEffects[i].startTime > this.visualEffects[i].duration) {
                this.visualEffects.splice(i, 1);
            }
        }
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
            const p0 = packet.player0;
            const p1 = packet.player1;
            if (p0 && p1) {
                const iAmPlayer0 = (p0.id === this.playerId);
                this.tradePartnerName = iAmPlayer0 ? p1.name : p0.name;
                // Store partner's full inventory for display
                this.tradePartnerInv = iAmPlayer0 ? packet.player1Inv : packet.player0Inv;
            }
            // Initialize our selection as all false (nothing selected)
            this.myTradeSelected = new Array(8).fill(false); // slots 4-11
            this.tradeConfirmed = false;
        } else {
            this.isTrading = false;
            this.tradePartnerName = '';
            this.tradePartnerInv = null;
            this.tradeSelection = null;
            this.tradeConfirmed = false;
            this.myTradeSelected = null;
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
        const SNAP_DISTANCE = 96;

        for (const [id, p] of this.players) {
            const dx = p.targetX - p.pos.x, dy = p.targetY - p.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > SNAP_DISTANCE) {
                p.pos.x = p.targetX; p.pos.y = p.targetY;
            } else if (id === this.playerId) {
                // LOCAL PLAYER: Snapshot interpolation with velocity prediction.
                //
                // Buffer the last 2 server positions. Render at a slight delay
                // (1 frame behind) and interpolate smoothly between snapshots.
                // This gives silky smooth motion without fighting prediction vs correction.
                //
                // When velocity is zero (stopped): snap immediately for crisp stops.
                // When velocity is non-zero (moving): Hermite-style smooth interpolation.

                if (!p._snapshots) p._snapshots = [];
                const hasVel = Math.abs(p.dx) > 0.01 || Math.abs(p.dy) > 0.01;

                if (!hasVel) {
                    // STOPPED: snap to server position immediately — crisp stops
                    if (dist > 0.5) {
                        p.pos.x += dx * 0.8;
                        p.pos.y += dy * 0.8;
                    }
                } else if (p._snapshots.length >= 2) {
                    // MOVING: interpolate between last two snapshots using Hermite
                    const s0 = p._snapshots[p._snapshots.length - 2];
                    const s1 = p._snapshots[p._snapshots.length - 1];
                    const duration = s1.t - s0.t;
                    if (duration > 0) {
                        // Render ~16ms behind latest snapshot for smooth interpolation
                        const renderTime = Date.now() - 16;
                        let t = (renderTime - s0.t) / duration;
                        t = Math.max(0, Math.min(1.5, t)); // Allow slight extrapolation

                        // Hermite basis functions for smooth curve
                        const t2 = t * t, t3 = t2 * t;
                        const h00 = 2*t3 - 3*t2 + 1;
                        const h10 = t3 - 2*t2 + t;
                        const h01 = -2*t3 + 3*t2;
                        const h11 = t3 - t2;

                        // Tangents from velocity * duration
                        const scale = duration / 16; // normalize to tick duration
                        const m0x = s0.vx * 0.45 * scale;
                        const m0y = s0.vy * 0.45 * scale;
                        const m1x = s1.vx * 0.45 * scale;
                        const m1y = s1.vy * 0.45 * scale;

                        p.pos.x = h00 * s0.x + h10 * m0x + h01 * s1.x + h11 * m1x;
                        p.pos.y = h00 * s0.y + h10 * m0y + h01 * s1.y + h11 * m1y;
                    }
                } else {
                    // Not enough snapshots yet — simple lerp
                    p.pos.x += dx * 0.6;
                    p.pos.y += dy * 0.6;
                }
            } else {
                // OTHER PLAYERS: smooth lerp, no velocity prediction
                // (player movement is unpredictable, extrapolation causes rubber-banding)
                p.pos.x += dx * 0.4;
                p.pos.y += dy * 0.4;
            }

            if (Math.abs(p.dx) > 0.1) p.facing = p.dx > 0 ? 'right' : 'left';
            p.animTimer = (p.animTimer || 0) + dt;
            if (p.animTimer > 0.125) { p.animTimer = 0; p.animFrame = ((p.animFrame || 0) + 1) % 2; }
        }

        // Enemies: lerp toward server position.
        // At 16-32Hz updates, use moderate lerp for smooth movement.
        for (const [id, e] of this.enemies) {
            const dx = e.targetX - e.pos.x, dy = e.targetY - e.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > SNAP_DISTANCE) {
                e.pos.x = e.targetX; e.pos.y = e.targetY;
            } else if (dist > 0.5) {
                e.pos.x += dx * 0.35;
                e.pos.y += dy * 0.35;
            }
        }

        // Bullets: fully client-predicted (server doesn't send ObjectMovePacket for bullets).
        // Server applies velocity once per tick at 64 ticks/sec.
        // Scale by dt * 64 to be frame-rate independent.
        const now = Date.now();
        const bulletScale = dt * 64; // 1.0 at 64fps, 1.067 at 60fps, 0.444 at 144fps
        for (const [id, b] of this.bullets) {
            const amp = b.amplitude || 0;
            const freq = b.frequency || 0;

            if (amp !== 0 && freq !== 0) {
                // Parametric (wavy) projectile
                if (b._timeStep === undefined) b._timeStep = 0;
                const prevOffset = amp * Math.sin(b._timeStep * Math.PI / 180);
                b._timeStep = (b._timeStep + freq * bulletScale) % 360;
                const currOffset = amp * Math.sin(b._timeStep * Math.PI / 180);
                const perpDelta = currOffset - prevOffset;

                const forwardX = Math.sin(b.angle) * b.magnitude * bulletScale;
                const forwardY = Math.cos(b.angle) * b.magnitude * bulletScale;
                const perpX = Math.cos(b.angle);
                const perpY = -Math.sin(b.angle);

                const inv = b.invert ? -1 : 1;
                b.pos.x += forwardX + perpX * perpDelta * inv;
                b.pos.y += forwardY + perpY * perpDelta * inv;
                b._traveled = (b._traveled || 0) + b.magnitude * bulletScale;
            } else {
                // Straight-line projectile
                const vx = Math.sin(b.angle) * b.magnitude * bulletScale;
                const vy = Math.cos(b.angle) * b.magnitude * bulletScale;
                b.pos.x += vx;
                b.pos.y += vy;
                b._traveled = (b._traveled || 0) + Math.sqrt(vx * vx + vy * vy);
            }

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

        // Expire finished visual effects
        this.updateVisualEffects();

        const local = this.getLocalPlayer();
        if (local) {
            this.cameraX += (local.pos.x - this.cameraX) * 0.35;
            this.cameraY += (local.pos.y - this.cameraY) * 0.35;
        }
    }

    // Loot container interaction range: player.getSize() * 0.75 (50% larger than original size/2)
    getNearbyLootContainer() {
        const local = this.getLocalPlayer();
        if (!local) return null;
        const maxDist = (local.size || 32) * 0.75;
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
        if (!map) return { text: 'Lv 1', pct: 0, isFame: false };
        const exp = Number(this.experience);
        const level = this.getPlayerLevel();
        const fame = this.getBaseFame();

        if (fame > 0) {
            // Max level reached (Lv 20) — show fame with gold bar
            return { text: `Lv 20  Fame: ${fame}`, pct: 100, isFame: true };
        }

        // Show XP progress within current level
        const range = map[level];
        if (!range) return { text: `Lv ${level}`, pct: 0, isFame: false };
        const pct = Math.min(100, (exp / range.max) * 100);
        return { text: `Lv ${level}  ${exp} / ${range.max}`, pct, isFame: false };
    }

    // Get max stats for the current class
    getMaxStats() {
        const classDef = this.characterClasses[this.classId];
        return classDef ? classDef.maxStats : null;
    }
}
