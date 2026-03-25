// PixiJS-based game renderer

import { CLASS_NAMES } from './game.js';

const BASE_SPRITE_SIZE = 8;
const PLAYER_SIZE = 8;
const SCALE = 4;  // Scale up pixel art
const VIEWPORT_TILES = 20; // Tiles visible in each direction

export class GameRenderer {
    constructor(container) {
        this.container = container;
        this.app = null;
        this.textures = {};
        this.tileTextures = {};
        this.tileSize = 32; // Updated from map data
        this.mapData = {};  // mapId -> map definition

        // PixiJS layers
        this.tileLayer = null;
        this.entityLayer = null;
        this.uiLayer = null;

        // Graphics for health bars and shapes
        this.healthBarGraphics = null;
        this.tileGraphics = null;
    }

    async init() {
        this.app = new PIXI.Application({
            resizeTo: this.container,
            backgroundColor: 0x211e27,
            antialias: false,
            resolution: 1,
        });
        // PixiJS v7 uses view property
        this.container.appendChild(this.app.view);

        // Set nearest neighbor scaling for pixel art
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        // Create layers
        this.tileLayer = new PIXI.Container();
        this.entityLayer = new PIXI.Container();
        this.uiLayer = new PIXI.Container();

        this.app.stage.addChild(this.tileLayer);
        this.app.stage.addChild(this.entityLayer);
        this.app.stage.addChild(this.uiLayer);

        this.healthBarGraphics = new PIXI.Graphics();
        this.uiLayer.addChild(this.healthBarGraphics);
    }

    async loadTexture(key, url) {
        try {
            const tex = await PIXI.Assets.load(url);
            tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            this.textures[key] = tex;
            return tex;
        } catch (e) {
            console.warn(`Failed to load texture ${key}: ${e.message}`);
            return null;
        }
    }

    // Extract a sprite region from a sprite sheet
    getRegion(textureKey, col, row, w = BASE_SPRITE_SIZE, h = BASE_SPRITE_SIZE) {
        // Normalize key: strip .png suffix to match loaded texture keys
        const key = textureKey.replace('.png', '');
        const tex = this.textures[key];
        if (!tex) return null;
        const rect = new PIXI.Rectangle(col * w, row * h, w, h);
        return new PIXI.Texture(tex.baseTexture, rect);
    }

    // Build tile texture lookup from tile definitions
    buildTileTextures(tileData) {
        this.tileTextures = {};
        let loaded = 0;
        for (const [tileId, tileDef] of Object.entries(tileData)) {
            if (!tileDef || !tileDef.spriteKey) continue;
            // spriteSize defaults to BASE_SPRITE_SIZE if 0 or missing (matches Java GameSpriteManager)
            const spriteSize = tileDef.spriteSize || BASE_SPRITE_SIZE;
            const tex = this.getRegion(
                tileDef.spriteKey,
                tileDef.col || 0,
                tileDef.row || 0,
                spriteSize,
                spriteSize
            );
            if (tex) {
                this.tileTextures[tileId] = tex;
                loaded++;
            }
        }
        console.log(`[RENDER] Built ${loaded} tile textures from ${Object.keys(tileData).length} definitions`);
    }

    // Set tile size from map data
    setMapData(mapDataArray) {
        if (Array.isArray(mapDataArray)) {
            for (const m of mapDataArray) {
                this.mapData[m.mapId] = m;
            }
        }
    }

    updateTileSize(mapId) {
        const mapDef = this.mapData[mapId];
        if (mapDef && mapDef.tileSize) {
            this.tileSize = mapDef.tileSize;
        }
    }

    render(gameState) {
        if (!this.app) return;

        const screenW = this.app.screen.width;
        const screenH = this.app.screen.height;

        // Debug: log once on first render with valid data
        if (!this._debugLogged && gameState.getLocalPlayer()) {
            this._debugLogged = true;
            const lp = gameState.getLocalPlayer();
            console.log(`[RENDER] Screen: ${screenW}x${screenH}, ` +
                `Player pos: (${lp.pos.x}, ${lp.pos.y}), ` +
                `Camera: (${gameState.cameraX}, ${gameState.cameraY}), ` +
                `MapTiles: ${gameState.mapTiles ? 'loaded' : 'null'}, ` +
                `Map: ${gameState.mapWidth}x${gameState.mapHeight}, ` +
                `TileTextures: ${Object.keys(this.tileTextures).length}, ` +
                `LoadedTextures: ${Object.keys(this.textures).length}, ` +
                `Players: ${gameState.players.size}, Enemies: ${gameState.enemies.size}`);
        }

        const camX = gameState.cameraX;
        const camY = gameState.cameraY;

        // Camera offset (center of screen)
        const offsetX = screenW / 2 - camX * SCALE;
        const offsetY = screenH / 2 - camY * SCALE;

        this.renderTiles(gameState, offsetX, offsetY, screenW, screenH);
        this.renderEntities(gameState, offsetX, offsetY);
        this.renderHealthBars(gameState, offsetX, offsetY);
    }

    renderTiles(gameState, offsetX, offsetY, screenW, screenH) {
        this.tileLayer.removeChildren();
        if (!gameState.mapTiles) return;

        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) return;

        const ts = this.tileSize; // Actual tile size from map data (e.g., 32)
        const playerTileX = Math.floor(localPlayer.pos.x / ts);
        const playerTileY = Math.floor(localPlayer.pos.y / ts);

        const minR = Math.max(0, playerTileY - VIEWPORT_TILES);
        const maxR = Math.min(gameState.mapHeight - 1, playerTileY + VIEWPORT_TILES);
        const minC = Math.max(0, playerTileX - VIEWPORT_TILES);
        const maxC = Math.min(gameState.mapWidth - 1, playerTileX + VIEWPORT_TILES);

        if (!this._tileDebugLogged && gameState.mapTiles) {
            this._tileDebugLogged = true;
            let tilesInView = 0;
            for (let r = minR; r <= maxR; r++) {
                for (let c = minC; c <= maxC; c++) {
                    const t = gameState.mapTiles[r]?.[c];
                    if (t && (t.base >= 0 || t.collision >= 0)) tilesInView++;
                }
            }
            console.log(`[TILES] tileSize=${ts}, playerTile=(${playerTileX},${playerTileY}), ` +
                `viewport: rows ${minR}-${maxR}, cols ${minC}-${maxC}, ` +
                `tilesInView=${tilesInView}, tileTextures=${Object.keys(this.tileTextures).length}`);
        }

        const drawSize = ts * SCALE;
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const tile = gameState.mapTiles[r][c];
                if (!tile) continue;

                const sx = c * ts * SCALE + offsetX;
                const sy = r * ts * SCALE + offsetY;

                // Base tile
                if (tile.base >= 0) {
                    const tex = this.tileTextures[tile.base];
                    if (tex) {
                        const spr = new PIXI.Sprite(tex);
                        spr.x = sx; spr.y = sy;
                        spr.width = drawSize; spr.height = drawSize;
                        this.tileLayer.addChild(spr);
                    } else {
                        const g = new PIXI.Graphics();
                        g.beginFill(this.getTileFallbackColor(tile.base));
                        g.drawRect(sx, sy, drawSize, drawSize);
                        g.endFill();
                        this.tileLayer.addChild(g);
                    }
                }

                // Collision/wall tile
                if (tile.collision >= 0) {
                    const tex = this.tileTextures[tile.collision];
                    if (tex) {
                        const shadow = new PIXI.Sprite(tex);
                        shadow.x = sx; shadow.y = sy + 3 * SCALE;
                        shadow.width = drawSize; shadow.height = drawSize;
                        shadow.tint = 0x222222; shadow.alpha = 0.5;
                        this.tileLayer.addChild(shadow);

                        const spr = new PIXI.Sprite(tex);
                        spr.x = sx; spr.y = sy;
                        spr.width = drawSize; spr.height = drawSize;
                        this.tileLayer.addChild(spr);
                    }
                }
            }
        }
    }

    renderEntities(gameState, offsetX, offsetY) {
        this.entityLayer.removeChildren();

        // Render loot containers
        for (const [id, loot] of gameState.lootContainers) {
            this.renderLootContainer(loot, offsetX, offsetY);
        }

        // Render portals
        for (const [id, portal] of gameState.portals) {
            this.renderPortal(portal, offsetX, offsetY);
        }

        // Render enemies
        for (const [id, enemy] of gameState.enemies) {
            this.renderEnemy(enemy, offsetX, offsetY, gameState);
        }

        // Render other players
        for (const [id, player] of gameState.players) {
            this.renderPlayer(player, offsetX, offsetY, id === gameState.playerId, gameState);
        }

        // Render bullets
        for (const [id, bullet] of gameState.bullets) {
            this.renderBullet(bullet, offsetX, offsetY, gameState);
        }
    }

    renderPlayer(player, offsetX, offsetY, isLocal, gameState) {
        const sx = player.pos.x * SCALE + offsetX;
        const sy = player.pos.y * SCALE + offsetY;
        const size = (player.size || PLAYER_SIZE) * SCALE;

        // Try to use sprite sheet
        const classId = player.classId || 0;
        const sheetIdx = Math.floor(classId / 3);
        const localRow = (classId % 3) * 4;
        const sheetKey = `rotmg-classes-${sheetIdx}`;

        const isMoving = Math.abs(player.dx || 0) > 0.1 || Math.abs(player.dy || 0) > 0.1;
        const frameCol = isMoving ? player.animFrame : 0;
        const row = localRow; // Side walk row

        const tex = this.getRegion(sheetKey, frameCol, row, PLAYER_SIZE, PLAYER_SIZE);
        if (tex) {
            // Outline/shadow
            const shadow = new PIXI.Sprite(tex);
            shadow.x = sx + 2;
            shadow.y = sy + 2;
            shadow.width = size;
            shadow.height = size;
            shadow.tint = 0x333333;
            shadow.alpha = 0.6;
            this.entityLayer.addChild(shadow);

            const spr = new PIXI.Sprite(tex);
            spr.x = sx;
            spr.y = sy;
            spr.width = size;
            spr.height = size;
            // Flip if facing left
            if (player.facing === 'left') {
                spr.anchor.set(1, 0);
                spr.scale.x = -Math.abs(spr.scale.x);
            }
            if (isLocal) spr.tint = 0xFFFFFF;
            this.entityLayer.addChild(spr);
        } else {
            // Fallback: colored square
            const g = new PIXI.Graphics();
            g.beginFill(isLocal ? 0x40c040 : 0x4080e0);
            g.drawRect(sx, sy, size, size);
            g.endFill();
            this.entityLayer.addChild(g);
        }

        // Player name
        const name = player.name || CLASS_NAMES[classId] || 'Player';
        const nameText = new PIXI.Text(name, {
            fontSize: 10, fill: isLocal ? 0x40ff40 : 0xffffff,
            fontFamily: 'monospace', fontWeight: 'bold',
            stroke: 0x000000, strokeThickness: 2
        });
        nameText.anchor.set(0.5, 1);
        nameText.x = sx + size / 2;
        nameText.y = sy - 4;
        this.entityLayer.addChild(nameText);
    }

    renderEnemy(enemy, offsetX, offsetY, gameState) {
        const sx = enemy.pos.x * SCALE + offsetX;
        const sy = enemy.pos.y * SCALE + offsetY;
        const size = (enemy.size || PLAYER_SIZE) * SCALE;

        // Try enemy sprite from data
        const enemyDef = gameState.enemyData[enemy.enemyId];
        let tex = null;
        if (enemyDef && enemyDef.spriteKey) {
            tex = this.getRegion(enemyDef.spriteKey, enemyDef.col || 0, enemyDef.row || 0,
                                 enemyDef.spriteSize || PLAYER_SIZE, enemyDef.spriteSize || PLAYER_SIZE);
        }

        if (tex) {
            const spr = new PIXI.Sprite(tex);
            spr.x = sx;
            spr.y = sy;
            spr.width = size;
            spr.height = size;
            this.entityLayer.addChild(spr);
        } else {
            const g = new PIXI.Graphics();
            g.beginFill(0xe04040);
            g.drawRect(sx, sy, size, size);
            g.endFill();
            this.entityLayer.addChild(g);
        }

        // Enemy name
        if (enemyDef) {
            const nameText = new PIXI.Text(enemyDef.name || `Enemy`, {
                fontSize: 9, fill: 0xff8080,
                fontFamily: 'monospace',
                stroke: 0x000000, strokeThickness: 2
            });
            nameText.anchor.set(0.5, 1);
            nameText.x = sx + size / 2;
            nameText.y = sy - 2;
            this.entityLayer.addChild(nameText);
        }
    }

    renderBullet(bullet, offsetX, offsetY, gameState) {
        const sx = bullet.pos.x * SCALE + offsetX;
        const sy = bullet.pos.y * SCALE + offsetY;
        const size = (bullet.size || 4) * SCALE;

        // Try projectile sprite from data
        const projGroup = gameState ? gameState.projectileGroups[bullet.projectileId] : null;
        let tex = null;
        if (projGroup && projGroup.spriteKey) {
            tex = this.getRegion(projGroup.spriteKey, projGroup.col || 0, projGroup.row || 0,
                                 projGroup.spriteSize || BASE_SPRITE_SIZE, projGroup.spriteSize || BASE_SPRITE_SIZE);
        }

        if (tex) {
            const spr = new PIXI.Sprite(tex);
            spr.x = sx; spr.y = sy;
            spr.width = size; spr.height = size;
            // Rotate based on bullet angle
            if (bullet.angle !== undefined) {
                spr.anchor.set(0.5, 0.5);
                spr.x = sx + size / 2;
                spr.y = sy + size / 2;
                spr.rotation = -bullet.angle;
            }
            this.entityLayer.addChild(spr);
        } else {
            const g = new PIXI.Graphics();
            g.beginFill(0xffff80);
            g.drawCircle(sx + size / 2, sy + size / 2, size / 3);
            g.endFill();
            this.entityLayer.addChild(g);
        }
    }

    renderLootContainer(loot, offsetX, offsetY) {
        const sx = loot.pos.x * SCALE + offsetX;
        const sy = loot.pos.y * SCALE + offsetY;
        const size = this.tileSize * SCALE;

        const g = new PIXI.Graphics();
        g.beginFill(loot.isChest ? 0xc8a86e : 0x8b6914);
        g.drawRect(sx + 4, sy + 4, size - 8, size - 8);
        g.endFill();
        g.lineStyle(1, 0xffffff, 0.5);
        g.drawRect(sx + 4, sy + 4, size - 8, size - 8);
        this.entityLayer.addChild(g);
    }

    renderPortal(portal, offsetX, offsetY) {
        const sx = portal.pos.x * SCALE + offsetX;
        const sy = portal.pos.y * SCALE + offsetY;
        const size = this.tileSize * SCALE * 2;

        const g = new PIXI.Graphics();
        g.beginFill(0x8040c0, 0.6);
        g.drawCircle(sx + size / 2, sy + size / 2, size / 2);
        g.endFill();
        g.lineStyle(2, 0xc080ff, 0.8);
        g.drawCircle(sx + size / 2, sy + size / 2, size / 2);
        this.entityLayer.addChild(g);
    }

    renderHealthBars(gameState, offsetX, offsetY) {
        this.healthBarGraphics.clear();

        for (const [id, enemy] of gameState.enemies) {
            if (enemy.maxHealth <= 0) continue;
            const sx = enemy.pos.x * SCALE + offsetX;
            const sy = enemy.pos.y * SCALE + offsetY;
            const size = (enemy.size || PLAYER_SIZE) * SCALE;
            const barW = size;
            const barH = 4;
            const barY = sy + size + 2;

            const pct = Math.max(0, enemy.health / enemy.maxHealth);

            // Background
            this.healthBarGraphics.beginFill(0x333333);
            this.healthBarGraphics.drawRect(sx, barY, barW, barH);
            this.healthBarGraphics.endFill();

            // Fill
            this.healthBarGraphics.beginFill(pct > 0.5 ? 0x40c040 : pct > 0.25 ? 0xc0c040 : 0xc04040);
            this.healthBarGraphics.drawRect(sx, barY, barW * pct, barH);
            this.healthBarGraphics.endFill();
        }
    }

    getTileFallbackColor(tileId) {
        // Simple hash for consistent colors
        const colors = [0x3a6b35, 0x4a7a45, 0x5a8a55, 0x6a5a40, 0x7a6a50,
                        0x404040, 0x505050, 0x2060a0, 0x8a7a60, 0x605030];
        return colors[Math.abs(tileId) % colors.length];
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: false });
            this.app = null;
        }
    }

    getWorldCoords(screenX, screenY, gameState) {
        const screenW = this.app.screen.width;
        const screenH = this.app.screen.height;
        const worldX = (screenX - screenW / 2) / SCALE + gameState.cameraX;
        const worldY = (screenY - screenH / 2) / SCALE + gameState.cameraY;
        return { x: worldX, y: worldY };
    }
}
