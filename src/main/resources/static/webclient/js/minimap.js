// Minimap module — renders a top-down view of the map with player positions.
// Tile canvas is cached on map load; only player dots update per frame.

const TILE_COLORS = {
    wall: '#aaaaaa', void: '#000000',
    sand: '#c8b888', grass: '#4a7a45', stone: '#606068',
    water: '#3060a0', lava: '#c04020', dark: '#2a2030',
    default: '#3a3a38'
};

export class Minimap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileImage = null; // offscreen cached tile render
        this.mapW = 0;
        this.mapH = 0;
        this.zoom = 1.0; // 1.0 = full map, smaller = zoomed in
        this.minZoom = 0.05;
        this.maxZoom = 1.0;
        this.hoveredPlayer = null;
        this.onTeleport = null; // callback(playerName)

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.05 : -0.05;
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
        }, { passive: false });

        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredPlayer && this.hoveredPlayer.teleportable && this.onTeleport) {
                this.onTeleport(this.hoveredPlayer.name);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this._updateHover(e);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredPlayer = null;
        });

        // Pinch-to-zoom for mobile
        this._pinchDist = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this._pinchDist = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (this._pinchDist > 0) {
                    const scale = dist / this._pinchDist;
                    if (scale > 1.05) { this.zoom = Math.min(this.maxZoom, this.zoom + 0.03); this._pinchDist = dist; }
                    else if (scale < 0.95) { this.zoom = Math.max(this.minZoom, this.zoom - 0.03); this._pinchDist = dist; }
                }
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { this._pinchDist = 0; });
    }

    buildTileCache(gameState) {
        if (!gameState.mapTiles || !gameState.mapWidth || !gameState.mapHeight) return;

        // Only create a new canvas if map dimensions changed
        if (this.mapW !== gameState.mapWidth || this.mapH !== gameState.mapHeight || !this.tileImage) {
            this.mapW = gameState.mapWidth;
            this.mapH = gameState.mapHeight;
            const offscreen = document.createElement('canvas');
            offscreen.width = this.mapW;
            offscreen.height = this.mapH;
            this.tileImage = offscreen;
            this._tileCtx = offscreen.getContext('2d');
            // Fill with void initially
            this._tileCtx.fillStyle = TILE_COLORS.void;
            this._tileCtx.fillRect(0, 0, this.mapW, this.mapH);
        }
    }

    // Paint specific tiles onto the minimap cache (called when LoadMap arrives)
    paintTiles(gameState, tiles) {
        if (!this.tileImage || !this._tileCtx || !tiles) return;
        const ctx = this._tileCtx;
        for (const t of tiles) {
            // Server swaps x/y: xIndex=row, yIndex=col
            const r = t.xIndex, c = t.yIndex;
            if (r < 0 || r >= this.mapH || c < 0 || c >= this.mapW) continue;
            const mapTile = gameState.mapTiles?.[r]?.[c];
            if (!mapTile) continue;
            if (mapTile.collision > 0) {
                const def = gameState.tileData?.[mapTile.collision];
                ctx.fillStyle = def?.data?.isWall ? TILE_COLORS.wall : TILE_COLORS.stone;
            } else if (mapTile.base > 0) {
                ctx.fillStyle = this._getTileColor(mapTile.base, gameState.tileData);
            } else {
                continue; // void, leave as black
            }
            ctx.fillRect(c, r, 1, 1);
        }
    }

    _getTileColor(tileId, tileData) {
        if (!tileId || tileId <= 0) return TILE_COLORS.void;
        const def = tileData?.[tileId];
        if (!def) return TILE_COLORS.default;
        const name = (def.name || '').toLowerCase();
        if (def.data?.slows && !def.data?.hasCollision) return TILE_COLORS.water;
        if (def.data?.damaging) return TILE_COLORS.lava;
        if (name.includes('sand') || name.includes('beach') || name.includes('desert')) return TILE_COLORS.sand;
        if (name.includes('grass') || name.includes('forest') || name.includes('green')) return TILE_COLORS.grass;
        if (name.includes('stone') || name.includes('grey') || name.includes('rock') || name.includes('cobble')) return TILE_COLORS.stone;
        if (name.includes('dark') || name.includes('void') || name.includes('obsidian')) return TILE_COLORS.dark;
        if (name.includes('water') || name.includes('ocean') || name.includes('sea')) return TILE_COLORS.water;
        // Fallback: hash tileId to a brownish color
        const hue = (tileId * 37) % 60 + 20;
        return `hsl(${hue}, 30%, 35%)`;
    }

    render(gameState) {
        if (!this.canvas.offsetParent) return;
        // Throttle to ~10 fps — minimap doesn't need 60fps
        const now = performance.now();
        if (now - (this._lastRender || 0) < 100) return;
        this._lastRender = now;

        if (!this.tileImage) return;

        // Only resize canvas buffer when container size actually changes
        const cw = this.canvas.clientWidth;
        const ch = this.canvas.clientHeight;
        if (cw === 0 || ch === 0) return;
        if (this.canvas.width !== cw) this.canvas.width = cw;
        if (this.canvas.height !== ch) this.canvas.height = ch;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, cw, ch);

        const local = gameState.getLocalPlayer();
        if (!local) return;

        const ts = 32; // tile size in world units
        // Player position in tile coords
        const playerTileX = local.pos.x / ts;
        const playerTileY = local.pos.y / ts;

        // View size in tiles based on zoom
        const viewW = this.mapW * this.zoom;
        const viewH = this.mapH * this.zoom;

        // View bounds centered on player
        let srcX = playerTileX - viewW / 2;
        let srcY = playerTileY - viewH / 2;
        // Clamp to map bounds
        srcX = Math.max(0, Math.min(srcX, this.mapW - viewW));
        srcY = Math.max(0, Math.min(srcY, this.mapH - viewH));

        // Draw cached tile image (scaled portion)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.tileImage, srcX, srcY, viewW, viewH, 0, 0, cw, ch);

        // Scale factors: tile coords → canvas pixels
        const scaleX = cw / viewW;
        const scaleY = ch / viewH;

        // Draw other players as yellow dots
        this.hoveredPlayer = null;
        const mouseX = this._mouseX;
        const mouseY = this._mouseY;

        for (const mp of gameState.minimapPlayers) {
            const tx = mp.x / ts - srcX;
            const ty = mp.y / ts - srcY;
            const px = tx * scaleX;
            const py = ty * scaleY;
            if (px < -5 || px > cw + 5 || py < -5 || py > ch + 5) continue;

            const isLocal = mp.playerId === gameState.playerId;

            if (isLocal) {
                // Green triangle for local player
                ctx.save();
                ctx.translate(px, py);
                const angle = Math.atan2(local.dy || 0, local.dx || 0);
                ctx.rotate(angle + Math.PI / 2);
                ctx.fillStyle = '#40ff40';
                ctx.beginPath();
                ctx.moveTo(0, -5);
                ctx.lineTo(-4, 4);
                ctx.lineTo(4, 4);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else {
                // Yellow dot for other players
                ctx.fillStyle = mp.teleportable ? '#ffdd44' : '#888866';
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();

                // Check hover
                if (mouseX !== undefined) {
                    const dx = px - mouseX, dy = py - mouseY;
                    if (dx * dx + dy * dy < 64) {
                        this.hoveredPlayer = mp;
                    }
                }
            }
        }

        // Draw hovered player name tooltip
        if (this.hoveredPlayer) {
            const mp = this.hoveredPlayer;
            const tx = mp.x / ts - srcX;
            const ty = mp.y / ts - srcY;
            const px = tx * scaleX;
            const py = ty * scaleY;
            ctx.font = '10px monospace';
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 5, py - 12, ctx.measureText(mp.name).width + 6, 14);
            ctx.fillStyle = mp.teleportable ? '#ffdd44' : '#888';
            ctx.fillText(mp.name, px + 8, py - 1);
            if (mp.teleportable) {
                ctx.fillStyle = '#aaa';
                ctx.font = '8px monospace';
                ctx.fillText('click to tp', px + 8, py + 9);
            }
        }
    }

    _updateHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        this._mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this._mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    }

    destroy() {
        this.tileImage = null;
        this.hoveredPlayer = null;
    }
}
