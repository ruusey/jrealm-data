// Game state management - entities, map, player data

export const CLASS_NAMES = ['Rogue', 'Archer', 'Wizard', 'Priest', 'Warrior', 'Knight', 'Paladin'];

export class GameState {
    constructor() {
        this.playerId = null;  // Set to actual ID on login
        this.playerName = '';
        this.classId = 0;

        // Entities keyed by ID
        this.players = new Map();
        this.enemies = new Map();
        this.bullets = new Map();
        this.lootContainers = new Map();
        this.portals = new Map();

        // Map data
        this.mapTiles = null;    // 2D array [row][col] = {base, collision}
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

        // Chat
        this.chatMessages = [];

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

    handleLoadMap(packet) {
        // Only reinitialize grid if this is a new map/realm
        const sameMap = this.mapTiles
            && this.realmId === packet.realmId
            && this.mapId === packet.mapId;

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

        // Fill in tile data (additive - multiple LoadMap packets accumulate)
        let baseCount = 0, collisionCount = 0;
        for (const tile of packet.tiles) {
            const r = tile.yIndex;
            const c = tile.xIndex;
            if (r >= 0 && r < this.mapHeight && c >= 0 && c < this.mapWidth) {
                if (tile.layer === 0) {
                    this.mapTiles[r][c].base = tile.tileId;
                    baseCount++;
                } else {
                    this.mapTiles[r][c].collision = tile.tileId;
                    collisionCount++;
                }
            }
        }
        console.log(`[MAP] Loaded ${baseCount} base + ${collisionCount} collision tiles ` +
            `(sameMap=${sameMap}, total received=${packet.tiles.length})`);
    }

    handleLoad(packet) {
        for (const p of packet.players) {
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
            const entityType = mov.entityType;
            const id = mov.entityId;

            // entityType: 0=player, 1=enemy, 2=bullet
            if (entityType === 0) {
                const p = this.players.get(id);
                if (p) {
                    p.targetX = mov.posX;
                    p.targetY = mov.posY;
                    p.dx = mov.velX;
                    p.dy = mov.velY;
                }
            } else if (entityType === 1) {
                const e = this.enemies.get(id);
                if (e) {
                    // Enemies snap directly (no lerp - they change direction frequently)
                    e.pos.x = mov.posX;
                    e.pos.y = mov.posY;
                    e.targetX = mov.posX;
                    e.targetY = mov.posY;
                    e.dx = mov.velX;
                    e.dy = mov.velY;
                }
            } else if (entityType === 2) {
                const b = this.bullets.get(id);
                if (b) {
                    b.targetX = mov.posX;
                    b.targetY = mov.posY;
                    b.dx = mov.velX;
                    b.dy = mov.velY;
                }
            }
        }
    }

    handleUpdate(packet) {
        const isLocalPlayer = packet.playerId === this.playerId;

        if (isLocalPlayer) {
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

        // Update entity (could be player or enemy)
        const player = this.players.get(packet.playerId);
        if (player) {
            player.name = packet.playerName;
            player.health = packet.health;
            player.maxHealth = packet.stats.hp;
            player.stats = packet.stats;
        }

        // Could also be enemy update (server reuses UpdatePacket for enemies)
        const enemy = this.enemies.get(packet.playerId);
        if (enemy) {
            enemy.health = packet.health;
        }
    }

    handleText(packet) {
        this.chatMessages.push({
            from: packet.from,
            to: packet.to,
            message: packet.message,
            time: Date.now()
        });
        // Keep last 100 messages
        if (this.chatMessages.length > 100) this.chatMessages.shift();
    }

    // Interpolation update (called each frame)
    updateInterpolation(dt) {
        const PLAYER_LERP = 0.35;
        const OTHER_LERP = 0.45;
        const BULLET_LERP = 0.65;
        const SNAP_DISTANCE = 96; // 3 tiles

        for (const [id, p] of this.players) {
            const lerp = id === this.playerId ? PLAYER_LERP : OTHER_LERP;
            const distX = p.targetX - p.pos.x;
            const distY = p.targetY - p.pos.y;
            const dist = Math.sqrt(distX * distX + distY * distY);

            if (dist > SNAP_DISTANCE) {
                p.pos.x = p.targetX;
                p.pos.y = p.targetY;
            } else {
                p.pos.x += distX * lerp;
                p.pos.y += distY * lerp;
            }

            // Update facing direction
            if (Math.abs(p.dx) > 0.1) {
                p.facing = p.dx > 0 ? 'right' : 'left';
            }

            // Animation
            p.animTimer += dt;
            if (p.animTimer > 0.125) { // 8 ticks at 64/sec
                p.animTimer = 0;
                p.animFrame = (p.animFrame + 1) % 2;
            }
        }

        for (const [id, b] of this.bullets) {
            b.pos.x += b.dx;
            b.pos.y += b.dy;
        }

        // Camera follows local player
        const local = this.getLocalPlayer();
        if (local) {
            const camLerp = 0.35;
            this.cameraX += (local.pos.x - this.cameraX) * camLerp;
            this.cameraY += (local.pos.y - this.cameraY) * camLerp;
        }
    }

    getPlayerLevel() {
        if (!this.expLevels || !this.expLevels.levelExperienceMap) return 1;
        const map = this.expLevels.levelExperienceMap;
        let level = 1;
        for (const [lvl, range] of Object.entries(map)) {
            const [min, max] = range.split('-').map(Number);
            if (this.experience >= min) level = parseInt(lvl);
        }
        return level;
    }
}
