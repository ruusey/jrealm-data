# OpenRealm Data

### Backend Data Service, Web Client & Game Editor for [OpenRealm](https://github.com/ruusey/openrealm)

![alt text](https://i.imgur.com/E4MiMd5.jpg)

---

## About

**OpenRealm Data** is the companion data service for the OpenRealm game server. It provides:

- **REST API** — Account management, authentication, player data persistence, character and vault storage
- **Web Client** — Full HTML5 game client with PixiJS rendering, mobile touch controls, and real-time WebSocket gameplay
- **Game Data Editor** — Web-based visual editor for creating and modifying all game content: tiles, enemies, items, maps, animations, projectile patterns, portals, loot tables, and more
- **Static Asset Serving** — Sprite sheets, fonts, and JSON game data files served via HTTP for both the game server and web client
- **Projectile Simulator** — Interactive canvas playground for testing enemy attack patterns and projectile behaviors

---

## Prerequisites

- Java JDK 11+
- Apache Maven 3.8.3+
- MongoDB Server

---

## Setup & Running

### 1. Database Setup

Create a MongoDB database named `jrealm`. On first run, the application will seed initial data from `src/main/resources/account_seed.json`. Edit this file to configure your initial admin account before first launch.

### 2. Build

OpenRealm Data depends on game model classes from the main [OpenRealm](https://github.com/ruusey/openrealm) repository. Build that first:

```bash
cd openrealm
mvn clean install
```

Then build the data service:

```bash
cd openrealm-data
mvn clean package
```

### 3. Run

```bash
java -jar target/openrealm-data-{version}.jar
```

The service starts on port **8080** by default. Configure via `src/main/resources/application.yaml`.

### 4. Access

| URL | Description |
|-----|-------------|
| `http://localhost:8080/game-data/webclient/index.html` | Web game client |
| `http://localhost:8080/game-data/editor/index.html` | Game data editor (admin login required) |
| `http://localhost:8080/ping` | Health check |

---

## API Endpoints

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/account/register` | Create a new account |
| POST | `/admin/account/login` | Login, returns session token |
| POST | `/admin/account/logout` | Invalidate session |
| GET | `/admin/account/token/resolve` | Resolve auth token to account (trusted hosts) |
| POST | `/admin/account/password` | Change password |

### Player Data

| Method | Path | Description |
|--------|------|-------------|
| GET | `/data/account/{guid}` | Get player account with characters |
| POST | `/data/account/{guid}/character` | Create new character |
| DELETE | `/data/account/character/{uuid}` | Delete character (permadeath) |
| GET/POST | `/data/account/{guid}/chest` | Get/save vault chests |

### Game Data (Editor)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/game-data/{filename}.json` | Retrieve any game data file |
| PUT | `/gamedata/tiles` | Save tiles (admin) |
| PUT | `/gamedata/enemies` | Save enemies (admin) |
| PUT | `/gamedata/items` | Save items (admin) |
| PUT | `/gamedata/maps` | Save maps (admin) |
| PUT | `/gamedata/projectiles` | Save projectile groups (admin) |
| PUT | `/gamedata/animations` | Save animations (admin) |
| PUT | `/gamedata/terrains` | Save terrains (admin) |
| PUT | `/gamedata/portals` | Save portals (admin) |
| PUT | `/gamedata/lootgroups` | Save loot groups (admin) |
| PUT | `/gamedata/loottables` | Save loot tables (admin) |

---

## Game Data Files

All game content is defined in JSON files located in `src/main/resources/data/`:

| File | Description |
|------|-------------|
| `character-classes.json` | Playable classes — base stats, max stats, starting equipment, sprite offsets |
| `enemies.json` | All enemies — stats, sprites, multi-phase AI with movement patterns and attack configurations |
| `game-items.json` | Weapons, armor, abilities, rings, consumables — damage, stat bonuses, effects, sprite references |
| `projectile-groups.json` | Bullet patterns — individual projectile angles, speed, range, amplitude/frequency for wavy shots, behavior flags |
| `animations.json` | Character sprite animations — idle, walk, and attack frames for all directions per class |
| `maps.json` | Map definitions — static tile layouts, procedural terrain references, dungeon parameters, spawn points, static portals |
| `terrains.json` | Procedural terrain templates — biome zones with tile groups, enemy groups, difficulty scaling, portal drops, set pieces |
| `tiles.json` | Tile definitions — sprites, collision flags, slow/damage properties |
| `portals.json` | Portal types — target maps, dungeon graph node routing |
| `dungeon-graph.json` | Dungeon node graph — defines realm connectivity, shared vs instanced nodes, entry points |
| `loot-groups.json` | Item groupings by category (potions, tiered weapons, rings, etc.) |
| `loot-tables.json` | Per-enemy drop tables with item group probabilities and portal drop chances |
| `exp-levels.json` | Experience curve and level thresholds |
| `realm-events.json` | Realm boss events — trigger conditions, minion waves, announcements |
| `setpieces.json` | Prefab tile structures for terrain decoration |

---

## Sprite Sheets

Sprite assets are located in `src/main/resources/entity/` and served at `/game-data/entity/{filename}`. The system supports variable sprite dimensions (spriteWidth x spriteHeight) for non-square sprites.

Current sprite sheets include character classes, enemies, bosses, items, tiles, projectiles, and environmental objects across multiple resolution tiers (8x8, 10x10, 16x16, 16x20, 32x32, 64x64).

---

## Game Data Editor

The built-in web editor at `/game-data/editor/index.html` provides visual editing for all game content:

- **Sprite Sheet Viewer** — Browse any sprite sheet with adjustable grid overlay (variable width/height)
- **Tile Editor** — Create and modify tiles with collision, slowing, and damage properties
- **Map Editor** — Paint static maps with tile brushes, place enemy spawns, player spawn points, static portals, and stamp set pieces
- **Enemy Editor** — Configure enemy stats, sprites, multi-phase AI with movement patterns and attack configurations
- **Item Editor** — Define weapons, armor, abilities with damage, stats, and effects
- **Projectile Editor** — Design bullet patterns with per-projectile angle, speed, range, and behavior flags
- **Animation Editor** — Configure character sprite animations with frame picking from sprite sheets
- **Projectile Simulator** — Interactive canvas playground to visualize and test projectile patterns with adjustable dexterity, aim modes, burst settings, and spread
- **Portal Editor** — Define portal types and dungeon graph routing
- **Loot Table Editor** — Configure per-enemy drop tables with item group probabilities

---

## Account System

### Account Types

| Type | Provisions | Capabilities |
|------|-----------|--------------|
| **Player** | `OPENREALM_PLAYER` | Full gameplay, unlimited characters and vault chests |
| **Guest/Demo** | `OPENREALM_DEMO` | Limited to 1 character, 1 vault chest, no trading, white name color |
| **Moderator** | `OPENREALM_MODERATOR` | Enemy spawning, player management |
| **Editor** | `OPENREALM_EDITOR` | Game data editor access |
| **Admin** | `OPENREALM_ADMIN` | Full game commands, stat modification, item spawning |
| **Sys Admin** | `OPENREALM_SYS_ADMIN` | Operator promotion, system-level access |

### Guest Accounts

Players can instantly start playing without registration via the "Play as Guest" button. Guest accounts are automatically created with a random name from a fixed pool. Credentials are shown once in a popup for the player to save. Session tokens enable auto-reconnection.

---

## License

Copyright (c) 2024-2026 Robert Usey. All rights reserved.

This software and associated documentation files (the "Software") are the exclusive property of Robert Usey. No part of this Software may be copied, modified, merged, published, distributed, sublicensed, sold, or otherwise made available to any third party, in whole or in part, in any form or by any means, without the prior express written permission of the copyright holder.

Unauthorized reproduction or distribution of this Software, or any portion of it, may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under the law.

For licensing inquiries, contact: **ruusey@gmail.com**
