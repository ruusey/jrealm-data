#!/usr/bin/env python3
"""
Generate new enemy data for OpenRealm based on scraped RealmEye monster data.
Produces: generated_enemies.json, generated_projectile_groups.json,
          generated_loot_tables.json, enemy_generation_log.json
"""

import json
import math
import os
import random

random.seed(42)  # Reproducible output

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "src", "main", "resources", "data")

# ── Load inputs ──────────────────────────────────────────────────────────────

with open(os.path.join(DATA_DIR, "realmeye_monsters.json"), "r") as f:
    realmeye_monsters = json.load(f)

with open(os.path.join(DATA_DIR, "enemies.json"), "r") as f:
    existing_enemies = json.load(f)

with open(os.path.join(DATA_DIR, "projectile-groups.json"), "r") as f:
    existing_proj_groups = json.load(f)

with open(os.path.join(DATA_DIR, "loot-tables.json"), "r") as f:
    existing_loot_tables = json.load(f)

# ── Constants ────────────────────────────────────────────────────────────────

NEXT_ENEMY_ID = 71
NEXT_PROJ_GROUP_ID = 113

# Sprite sheets available for projectiles (each cell 8x8)
PROJ_SHEETS = [
    {"key": "lofiProjectiles.png",    "cols": 8,  "rows": 10},
    {"key": "rotmg-projectiles.png",  "cols": 16, "rows": 16},
    {"key": "lofiProjs.png",          "cols": 16, "rows": 16},
]

# Entity sprite sheets
# lofiCharacter10x10.png: 24 cols x 44 rows, rows 20-43 available
# lofiBosses16x16.png:    24 cols x 3 rows, all available
# lofiBosses16x20.png:    24 cols x 3 rows, all available, spriteHeight=20
# rotmg-bosses-1.png:     8 cols x 15 rows, (6,2) and (11,4) used

# ── Sprite allocation trackers ───────────────────────────────────────────────

used_entity_sprites = set()   # (sheet, row, col)
used_proj_sprites = set()     # (sheet, row, col)

# Pre-mark used projectile sprites from existing data
for pg in existing_proj_groups:
    key = pg.get("spriteKey", "")
    r = pg.get("row", -1)
    c = pg.get("col", -1)
    used_proj_sprites.add((key, r, c))

# Pre-mark used entity sprites from existing data
for en in existing_enemies:
    key = en.get("spriteKey", "")
    r = en.get("row", -1)
    c = en.get("col", -1)
    used_entity_sprites.add((key, r, c))

# Also mark the two known used cells in rotmg-bosses-1.png
used_entity_sprites.add(("rotmg-bosses-1.png", 6, 2))
used_entity_sprites.add(("rotmg-bosses-1.png", 11, 4))


def alloc_entity_sprite(difficulty):
    """Allocate a unique entity sprite cell based on difficulty tier."""
    if difficulty == "low":
        sheet = "lofiCharacter10x10.png"
        for row in range(20, 44):
            for col in range(24):
                if (sheet, row, col) not in used_entity_sprites:
                    used_entity_sprites.add((sheet, row, col))
                    return sheet, row, col, 10, 10, 24  # spriteSize, spriteHeight, size
        # Fallback
        raise RuntimeError("No more low-tier entity sprites available")

    elif difficulty == "mid":
        # Use lofiCharacter10x10 rows 30-43 first, then lofiBosses16x16
        sheet = "lofiCharacter10x10.png"
        for row in range(30, 44):
            for col in range(24):
                if (sheet, row, col) not in used_entity_sprites:
                    used_entity_sprites.add((sheet, row, col))
                    return sheet, row, col, 10, 10, 28
        sheet = "lofiBosses16x16.png"
        for row in range(3):
            for col in range(24):
                if (sheet, row, col) not in used_entity_sprites:
                    used_entity_sprites.add((sheet, row, col))
                    return sheet, row, col, 16, 16, 32
        raise RuntimeError("No more mid-tier entity sprites available")

    elif difficulty == "high":
        # Use lofiBosses16x16 then lofiBosses16x20
        for sheet_name, h, sz in [("lofiBosses16x16.png", 16, 34),
                                   ("lofiBosses16x20.png", 20, 38)]:
            for row in range(3):
                for col in range(24):
                    if (sheet_name, row, col) not in used_entity_sprites:
                        used_entity_sprites.add((sheet_name, row, col))
                        return sheet_name, row, col, 16, h, sz
        raise RuntimeError("No more high-tier entity sprites available")

    else:  # boss
        # Use rotmg-bosses-1.png first, then lofiBosses16x20
        sheet = "rotmg-bosses-1.png"
        for row in range(15):
            for col in range(8):
                if (sheet, row, col) not in used_entity_sprites:
                    used_entity_sprites.add((sheet, row, col))
                    return sheet, row, col, 16, 16, 38
        sheet = "lofiBosses16x20.png"
        for row in range(3):
            for col in range(24):
                if (sheet, row, col) not in used_entity_sprites:
                    used_entity_sprites.add((sheet, row, col))
                    return sheet, row, col, 16, 20, 38
        raise RuntimeError("No more boss entity sprites available")


# Projectile sprite allocator – cycles through sheets
_proj_iter_idx = 0
_proj_sheet_idx = 0

def alloc_proj_sprite():
    """Allocate a unique projectile sprite cell."""
    global _proj_sheet_idx
    for _ in range(3):  # try each sheet
        s = PROJ_SHEETS[_proj_sheet_idx % 3]
        for row in range(s["rows"]):
            for col in range(s["cols"]):
                if (s["key"], row, col) not in used_proj_sprites:
                    used_proj_sprites.add((s["key"], row, col))
                    return s["key"], row, col
        _proj_sheet_idx += 1
    raise RuntimeError("No more projectile sprites available")


# ── Helpers ──────────────────────────────────────────────────────────────────

def range_to_pixels(tile_range):
    """Convert RealmEye tile range to pixel range, with a floor."""
    if tile_range <= 0:
        return 128  # melee/bomb range
    return max(96, int(tile_range * 32))


def pick_magnitude(difficulty):
    """Projectile speed based on difficulty."""
    return {"low": 2.8, "mid": 3.2, "high": 3.8, "boss": 4.0}.get(difficulty, 3.0)


def pick_movement(difficulty, phase_idx):
    """Pick a movement type and params for a phase."""
    if difficulty == "low":
        choices = [
            {"type": "CHASE", "speed": round(random.uniform(0.8, 1.0), 1)},
            {"type": "WANDER", "speed": round(random.uniform(0.6, 0.9), 1), "wanderRadius": 120},
        ]
        return random.choice(choices)

    elif difficulty == "mid":
        if phase_idx == 0:
            choices = [
                {"type": "CHASE", "speed": round(random.uniform(1.0, 1.3), 1)},
                {"type": "STRAFE", "speed": round(random.uniform(1.0, 1.4), 1), "preferredRange": random.randint(80, 140)},
                {"type": "ORBIT", "speed": round(random.uniform(1.0, 1.4), 1), "radius": random.randint(60, 120), "direction": random.choice(["CW", "CCW"])},
            ]
        else:
            choices = [
                {"type": "CHARGE", "speed": round(random.uniform(1.4, 1.8), 1), "chargeDistanceMin": 40, "pauseMs": 400},
                {"type": "CHASE", "speed": round(random.uniform(1.2, 1.6), 1)},
            ]
        return random.choice(choices)

    elif difficulty == "high":
        if phase_idx == 0:
            choices = [
                {"type": "STRAFE", "speed": round(random.uniform(1.2, 1.6), 1), "preferredRange": random.randint(80, 120)},
                {"type": "ORBIT", "speed": round(random.uniform(1.2, 1.6), 1), "radius": random.randint(60, 100), "direction": random.choice(["CW", "CCW"])},
                {"type": "ANCHOR", "speed": round(random.uniform(1.0, 1.4), 1), "anchorRadius": random.randint(30, 80)},
            ]
        elif phase_idx == 1:
            choices = [
                {"type": "CHARGE", "speed": round(random.uniform(1.6, 2.0), 1), "chargeDistanceMin": 50, "pauseMs": 350},
                {"type": "CHASE", "speed": round(random.uniform(1.4, 1.8), 1)},
            ]
        else:
            choices = [
                {"type": "FLEE", "speed": round(random.uniform(1.6, 2.2), 1), "fleeRange": 100},
                {"type": "CHARGE", "speed": round(random.uniform(1.8, 2.4), 1), "chargeDistanceMin": 30, "pauseMs": 300},
            ]
        return random.choice(choices)

    else:  # boss
        if phase_idx == 0:
            choices = [
                {"type": "ANCHOR", "speed": round(random.uniform(1.0, 1.4), 1), "anchorRadius": random.randint(30, 60)},
                {"type": "ORBIT", "speed": round(random.uniform(1.0, 1.6), 1), "radius": random.randint(80, 140), "direction": random.choice(["CW", "CCW"])},
                {"type": "FIGURE_EIGHT", "speed": round(random.uniform(1.0, 1.4), 1), "radius": random.randint(60, 100)},
            ]
        elif phase_idx == 1:
            choices = [
                {"type": "STRAFE", "speed": round(random.uniform(1.4, 1.8), 1), "preferredRange": random.randint(60, 100)},
                {"type": "CHARGE", "speed": round(random.uniform(1.6, 2.0), 1), "chargeDistanceMin": 50, "pauseMs": 350},
                {"type": "ORBIT", "speed": round(random.uniform(1.4, 2.0), 1), "radius": random.randint(50, 80), "direction": random.choice(["CW", "CCW"])},
            ]
        else:
            choices = [
                {"type": "CHARGE", "speed": round(random.uniform(1.8, 2.4), 1), "chargeDistanceMin": 30, "pauseMs": 250},
                {"type": "CHASE", "speed": round(random.uniform(1.6, 2.2), 1)},
                {"type": "FLEE", "speed": round(random.uniform(1.8, 2.4), 1), "fleeRange": 120},
            ]
        return random.choice(choices)


def attack_to_aim_mode(attack):
    """Map RealmEye attack pattern to game aimMode."""
    p = attack.get("pattern", "aimed")
    if p == "ring":
        return "RING"
    elif p == "spiral":
        return "RING"
    elif p in ("aimed", "wave", "parametric", "boomerang", "bomb"):
        return "PLAYER"
    elif p == "spread":
        return "PLAYER"
    return "PLAYER"


def build_attack_entry(proj_group_id, attack, difficulty):
    """Build a phase attack entry referencing a projectile group."""
    pattern = attack.get("pattern", "aimed")
    proj_count = attack.get("projectileCount", 1)

    entry = {"projectileGroupId": proj_group_id}

    # Cooldown based on difficulty
    base_cd = {"low": 800, "mid": 600, "high": 480, "boss": 400}.get(difficulty, 600)
    entry["cooldownMs"] = base_cd + random.randint(-100, 150)

    if pattern == "ring":
        entry["aimMode"] = "RING"
        entry["shotCount"] = proj_count if proj_count > 1 else random.randint(8, 14)
    elif pattern == "spread":
        entry["aimMode"] = "PLAYER"
        entry["shotCount"] = proj_count
        entry["spreadAngle"] = round(random.uniform(0.3, 0.7), 2)
    elif pattern == "spiral":
        entry["aimMode"] = "RING"
        entry["shotCount"] = proj_count if proj_count > 1 else 8
        entry["burstCount"] = random.randint(3, 5)
        entry["burstDelayMs"] = random.randint(80, 150)
        entry["angleOffsetPerBurst"] = round(random.uniform(0.2, 0.4), 2)
    else:
        # aimed, wave, parametric, boomerang, bomb
        if proj_count > 1:
            entry["shotCount"] = proj_count
            entry["spreadAngle"] = round(random.uniform(0.15, 0.5), 2)

    # Add burst for higher difficulties
    if difficulty in ("high", "boss") and pattern not in ("spiral",) and random.random() < 0.4:
        entry["burstCount"] = random.randint(2, 4)
        entry["burstDelayMs"] = random.randint(60, 120)

    return entry


def build_projectile_group(proj_group_id, attack, difficulty):
    """Build a projectile group from a RealmEye attack."""
    sprite_key, sprite_row, sprite_col = alloc_proj_sprite()
    mag = pick_magnitude(difficulty)
    pixel_range = range_to_pixels(attack.get("range", 5))
    damage = attack.get("damage", 10)
    pattern = attack.get("pattern", "aimed")
    amplitude = attack.get("amplitude", 0)
    frequency = attack.get("frequency", 0)

    # Position mode: 0 = TARGET_PLAYER for aimed, 2 for ring/absolute
    pos_mode = 2 if pattern in ("ring", "spiral") else 0

    flags = [10]  # player-targeted
    if pattern == "wave" and (amplitude > 0 or frequency > 0):
        flags.append(12)  # PARAMETRIC
    if pattern == "parametric":
        flags.append(12)

    proj = {
        "projectileId": proj_group_id,
        "positionMode": pos_mode,
        "damage": damage,
        "angle": 0,
        "range": pixel_range,
        "size": 16,
        "magnitude": round(mag + random.uniform(-0.3, 0.3), 1),
        "flags": flags,
    }

    if amplitude > 0:
        proj["amplitude"] = amplitude
    if frequency > 0:
        proj["frequency"] = frequency

    # For multi-shot aimed/spread, create multiple projectiles with angle offsets
    projectiles = []
    proj_count = attack.get("projectileCount", 1)

    if pattern in ("spread",) and proj_count > 1:
        spread = 0.5
        step = spread / max(proj_count - 1, 1)
        start = -spread / 2
        for i in range(proj_count):
            p = dict(proj)
            p["angle"] = round(start + i * step, 3)
            projectiles.append(p)
    elif pattern in ("ring", "spiral") and proj_count > 1:
        step = round(2 * math.pi / proj_count, 4)
        for i in range(proj_count):
            p = dict(proj)
            p["angle"] = f"{{{{{'%.4f' % (step * i)}}}}}" if i > 0 else 0
            # Use numeric for simplicity
            p["angle"] = round(step * i, 4)
            projectiles.append(p)
    elif proj_count > 1 and pattern == "aimed":
        # Multi aimed = slight spread
        spread = 0.3
        step = spread / max(proj_count - 1, 1)
        start = -spread / 2
        for i in range(proj_count):
            p = dict(proj)
            p["angle"] = round(start + i * step, 3)
            projectiles.append(p)
    else:
        projectiles.append(proj)

    group = {
        "projectileGroupId": proj_group_id,
        "row": sprite_row,
        "col": sprite_col,
        "spriteKey": sprite_key,
        "projectiles": projectiles,
    }

    # Add angle offset for directional projectile sprites
    if random.random() < 0.3:
        group["angleOffset"] = "{{PI/4}}"

    return group


def make_loot_table(enemy_id, difficulty):
    """Generate a loot table entry based on difficulty tier."""
    drops = {}
    portal_drops = {}

    if difficulty == "low":
        drops["group:0"] = 1.0  # base potions always
        # T0-T2 weapons/armor at low rates
        drops["group:3"] = round(random.uniform(0.05, 0.10), 2)  # T0 weapons
        drops["group:4"] = round(random.uniform(0.03, 0.07), 2)  # T1 weapons
        drops["group:5"] = round(random.uniform(0.02, 0.05), 2)  # T2 weapons
        drops["group:18"] = round(random.uniform(0.05, 0.10), 2)  # T1 armor
        drops["group:19"] = round(random.uniform(0.03, 0.07), 2)  # T2 armor
        drops["group:33"] = round(random.uniform(0.05, 0.12), 2)  # T0-T1 abilities

    elif difficulty == "mid":
        drops["group:0"] = 1.0
        drops["group:6"] = round(random.uniform(0.15, 0.25), 2)  # T3 weapons
        drops["group:7"] = round(random.uniform(0.12, 0.20), 2)  # T4 weapons
        drops["group:8"] = round(random.uniform(0.06, 0.12), 2)  # T5 weapons
        drops["group:20"] = round(random.uniform(0.12, 0.22), 2)  # T3 armor
        drops["group:21"] = round(random.uniform(0.10, 0.18), 2)  # T4 armor
        drops["group:22"] = round(random.uniform(0.05, 0.10), 2)  # T5 armor
        drops["group:34"] = round(random.uniform(0.10, 0.18), 2)  # T2-T3 abilities
        drops["group:37"] = round(random.uniform(0.04, 0.10), 2)  # Superior rings
        # Portal drops to low dungeons
        portal_drops[str(random.choice([6, 10, 11]))] = round(random.uniform(0.04, 0.08), 2)

    elif difficulty == "high":
        drops["group:0"] = 1.0
        drops["group:1"] = 1.0  # special potions
        drops["group:9"] = round(random.uniform(0.18, 0.28), 2)   # T6 weapons
        drops["group:10"] = round(random.uniform(0.14, 0.22), 2)  # T7 weapons
        drops["group:11"] = round(random.uniform(0.08, 0.14), 2)  # T8 weapons
        drops["group:23"] = round(random.uniform(0.16, 0.24), 2)  # T6 armor
        drops["group:24"] = round(random.uniform(0.10, 0.18), 2)  # T7 armor (actually T8)
        drops["group:25"] = round(random.uniform(0.06, 0.12), 2)  # T9 armor
        drops["group:35"] = round(random.uniform(0.10, 0.16), 2)  # T4-T5 abilities
        drops["group:37"] = round(random.uniform(0.06, 0.12), 2)  # Superior rings
        portal_drops[str(random.choice([7, 8, 12, 14]))] = round(random.uniform(0.05, 0.08), 2)
        portal_drops[str(random.choice([13, 15]))] = round(random.uniform(0.03, 0.06), 2)

    else:  # boss
        drops["group:0"] = 1.0
        drops["group:1"] = 1.0
        drops["group:12"] = round(random.uniform(0.14, 0.22), 2)  # T9 weapons
        drops["group:13"] = round(random.uniform(0.10, 0.18), 2)  # T10 weapons
        drops["group:14"] = round(random.uniform(0.06, 0.12), 2)  # T11 weapons
        drops["group:15"] = round(random.uniform(0.03, 0.06), 2)  # T12 weapons
        drops["group:26"] = round(random.uniform(0.12, 0.20), 2)  # T11 armor
        drops["group:27"] = round(random.uniform(0.08, 0.16), 2)  # T12 armor
        drops["group:28"] = round(random.uniform(0.04, 0.10), 2)  # T13 armor
        drops["group:35"] = round(random.uniform(0.08, 0.14), 2)  # T4-T5 abilities
        drops["group:36"] = round(random.uniform(0.03, 0.08), 2)  # T6 abilities
        drops["group:38"] = round(random.uniform(0.04, 0.10), 2)  # Exalted rings
        portal_drops[str(random.choice([8, 9, 15, 17]))] = round(random.uniform(0.04, 0.08), 2)
        portal_drops[str(random.choice([12, 13, 16]))] = round(random.uniform(0.03, 0.06), 2)

    entry = {"enemyId": enemy_id, "drops": drops}
    if portal_drops:
        entry["portalDrops"] = portal_drops
    return entry


# ── Main generation ──────────────────────────────────────────────────────────

generated_enemies = []
generated_proj_groups = []
generated_loot_tables = []
generation_log = []

enemy_id = NEXT_ENEMY_ID
proj_group_id = NEXT_PROJ_GROUP_ID

# Filter out monsters with no attacks (useless as enemies) and Dr Terrible (no attacks)
candidates = [m for m in realmeye_monsters if len(m.get("attacks", [])) > 0]

# Sort by difficulty order: low, mid, high, boss
diff_order = {"low": 0, "mid": 1, "high": 2, "boss": 3}
candidates.sort(key=lambda m: (diff_order.get(m["difficulty"], 4), m["name"]))

# All valid monsters (59 total, within budget and sprite availability)
# This gives us a good variety across all tiers
candidates = candidates[:59]

print(f"Processing {len(candidates)} monsters from RealmEye data...\n")

for monster in candidates:
    name = monster["name"]
    difficulty = monster["difficulty"]
    attacks = monster["attacks"]
    hp = monster["hp"]
    defense = monster["def"]
    xp = monster["exp"]

    # ── Allocate entity sprite ───────────────────────────────────────────
    sprite_key, sprite_row, sprite_col, sprite_size, sprite_height, entity_size = \
        alloc_entity_sprite(difficulty)

    # ── Create projectile groups for each attack (max 3) ─────────────────
    selected_attacks = attacks[:3]  # Limit to 3 attacks
    my_proj_group_ids = []

    for atk in selected_attacks:
        pg = build_projectile_group(proj_group_id, atk, difficulty)
        generated_proj_groups.append(pg)
        my_proj_group_ids.append(proj_group_id)
        proj_group_id += 1

    # ── Stats ────────────────────────────────────────────────────────────
    dex_map = {"low": random.randint(5, 10), "mid": random.randint(10, 20),
               "high": random.randint(20, 40), "boss": random.randint(30, 50)}
    dex = dex_map[difficulty]

    vit = max(1, int(hp * 0.005))  # Rough scaling with HP
    if difficulty == "boss":
        vit = max(20, int(hp * 0.002))

    speed_map = {
        "low":  round(random.uniform(0.8, 1.0), 1),
        "mid":  round(random.uniform(1.0, 1.4), 1),
        "high": round(random.uniform(1.2, 1.6), 1),
        "boss": round(random.uniform(0.8, 1.4), 1),
    }
    max_speed = speed_map[difficulty]

    chase_range_map = {
        "low":  random.randint(200, 300),
        "mid":  random.randint(250, 350),
        "high": random.randint(300, 400),
        "boss": random.randint(300, 400),
    }
    chase_range = chase_range_map[difficulty]

    # Attack range = longest projectile range in pixels
    longest_range = max(range_to_pixels(a.get("range", 5)) for a in selected_attacks)
    attack_range = min(longest_range, 800)

    # ── Phases ───────────────────────────────────────────────────────────
    phases = []
    if difficulty == "low":
        # 1 phase, simple
        phase_attacks = []
        for i, pg_id in enumerate(my_proj_group_ids):
            phase_attacks.append(build_attack_entry(pg_id, selected_attacks[i], difficulty))
        phases.append({
            "name": "default",
            "hpThreshold": 1.0,
            "movement": pick_movement(difficulty, 0),
            "attacks": phase_attacks,
        })

    elif difficulty == "mid":
        # 1-2 phases
        # Phase 1: all attacks
        phase1_attacks = []
        for i, pg_id in enumerate(my_proj_group_ids):
            phase1_attacks.append(build_attack_entry(pg_id, selected_attacks[i], difficulty))
        phases.append({
            "name": "default",
            "hpThreshold": 1.0,
            "movement": pick_movement(difficulty, 0),
            "attacks": phase1_attacks,
        })
        # Phase 2: enraged at 50% HP (faster cooldowns)
        if len(my_proj_group_ids) >= 1 and random.random() < 0.6:
            enraged_attacks = []
            for i, pg_id in enumerate(my_proj_group_ids):
                entry = build_attack_entry(pg_id, selected_attacks[i], difficulty)
                entry["cooldownMs"] = max(200, entry["cooldownMs"] - 200)
                enraged_attacks.append(entry)
            phases.append({
                "name": "enraged",
                "hpThreshold": 0.5,
                "movement": pick_movement(difficulty, 1),
                "attacks": enraged_attacks,
            })

    elif difficulty == "high":
        # 2-3 phases
        # Phase 1
        p1_attacks = []
        for i, pg_id in enumerate(my_proj_group_ids[:2]):
            p1_attacks.append(build_attack_entry(pg_id, selected_attacks[i], difficulty))
        phases.append({
            "name": "default",
            "hpThreshold": 1.0,
            "movement": pick_movement(difficulty, 0),
            "attacks": p1_attacks,
        })
        # Phase 2: add all attacks, faster
        p2_attacks = []
        for i, pg_id in enumerate(my_proj_group_ids):
            entry = build_attack_entry(pg_id, selected_attacks[i], difficulty)
            entry["cooldownMs"] = max(180, entry["cooldownMs"] - 200)
            p2_attacks.append(entry)
        phases.append({
            "name": "enraged",
            "hpThreshold": 0.5,
            "movement": pick_movement(difficulty, 1),
            "attacks": p2_attacks,
        })
        # Phase 3: desperate
        if random.random() < 0.5:
            p3_attacks = []
            for i, pg_id in enumerate(my_proj_group_ids):
                entry = build_attack_entry(pg_id, selected_attacks[i], difficulty)
                entry["cooldownMs"] = max(150, entry["cooldownMs"] - 350)
                if "burstCount" not in entry:
                    entry["burstCount"] = 2
                    entry["burstDelayMs"] = 80
                p3_attacks.append(entry)
            phases.append({
                "name": "desperate",
                "hpThreshold": 0.25,
                "movement": pick_movement(difficulty, 2),
                "attacks": p3_attacks,
            })

    else:  # boss
        # 2-3 phases
        # Phase 1: measured, uses first 1-2 attacks
        p1_attacks = []
        for i, pg_id in enumerate(my_proj_group_ids[:2]):
            p1_attacks.append(build_attack_entry(pg_id, selected_attacks[i], difficulty))
        phases.append({
            "name": "default",
            "hpThreshold": 1.0,
            "movement": pick_movement(difficulty, 0),
            "attacks": p1_attacks,
        })
        # Phase 2: enraged at 50%, all attacks faster
        p2_attacks = []
        for i, pg_id in enumerate(my_proj_group_ids):
            entry = build_attack_entry(pg_id, selected_attacks[i], difficulty)
            entry["cooldownMs"] = max(200, entry["cooldownMs"] - 200)
            if random.random() < 0.5 and "burstCount" not in entry:
                entry["burstCount"] = random.randint(2, 3)
                entry["burstDelayMs"] = random.randint(60, 100)
            p2_attacks.append(entry)
        phases.append({
            "name": "enraged",
            "hpThreshold": 0.5,
            "movement": pick_movement(difficulty, 1),
            "attacks": p2_attacks,
        })
        # Phase 3: desperate at 25%
        p3_attacks = []
        for i, pg_id in enumerate(my_proj_group_ids):
            entry = build_attack_entry(pg_id, selected_attacks[i], difficulty)
            entry["cooldownMs"] = max(150, entry["cooldownMs"] - 350)
            if "burstCount" not in entry:
                entry["burstCount"] = random.randint(3, 5)
                entry["burstDelayMs"] = random.randint(50, 90)
            if "angleOffsetPerBurst" not in entry and random.random() < 0.4:
                entry["angleOffsetPerBurst"] = round(random.uniform(0.1, 0.3), 2)
            p3_attacks.append(entry)
        phases.append({
            "name": "desperate",
            "hpThreshold": 0.25,
            "movement": pick_movement(difficulty, 2),
            "attacks": p3_attacks,
        })

    # ── Build enemy entry ────────────────────────────────────────────────
    enemy_entry = {
        "enemyId": enemy_id,
        "name": name,
        "spriteKey": sprite_key,
        "row": sprite_row,
        "col": sprite_col,
        "spriteSize": sprite_size,
        "size": entity_size,
        "attackId": my_proj_group_ids[0],
        "xp": xp,
        "health": hp,
        "maxSpeed": max_speed,
        "chaseRange": chase_range,
        "attackRange": attack_range,
        "stats": {
            "hp": hp,
            "def": defense,
            "dex": dex,
            "mp": 0,
            "att": 0,
            "spd": 0,
            "vit": vit,
            "wis": 0,
        },
        "phases": phases,
    }

    # Add spriteHeight if not equal to spriteSize
    if sprite_height != sprite_size:
        enemy_entry["spriteHeight"] = sprite_height

    generated_enemies.append(enemy_entry)

    # ── Loot table ───────────────────────────────────────────────────────
    loot_entry = make_loot_table(enemy_id, difficulty)
    generated_loot_tables.append(loot_entry)

    # ── Log entry ────────────────────────────────────────────────────────
    log_entry = {
        "enemyId": enemy_id,
        "name": name,
        "realmeyeSource": monster.get("realmeyeUrl", ""),
        "spriteSheet": sprite_key,
        "spriteRow": sprite_row,
        "spriteCol": sprite_col,
        "difficulty": difficulty,
        "projectileGroupIds": my_proj_group_ids,
        "notes": f"Based on {name} from RealmEye. HP={hp}, DEF={defense}, "
                 f"{len(selected_attacks)} attack(s), {len(phases)} phase(s).",
    }
    generation_log.append(log_entry)

    print(f"  [{enemy_id:3d}] {name:<40s} ({difficulty:>4s}) "
          f"HP={hp:>6d}  DEF={defense:>3d}  PGs={my_proj_group_ids}  "
          f"Phases={len(phases)}  Sprite={sprite_key}:{sprite_row},{sprite_col}")

    enemy_id += 1


# ── Write outputs ────────────────────────────────────────────────────────────

out_enemies = os.path.join(DATA_DIR, "generated_enemies.json")
out_proj_groups = os.path.join(DATA_DIR, "generated_projectile_groups.json")
out_loot_tables = os.path.join(DATA_DIR, "generated_loot_tables.json")
out_log = os.path.join(DATA_DIR, "enemy_generation_log.json")

with open(out_enemies, "w") as f:
    json.dump(generated_enemies, f, indent="\t")

with open(out_proj_groups, "w") as f:
    json.dump(generated_proj_groups, f, indent="\t")

with open(out_loot_tables, "w") as f:
    json.dump(generated_loot_tables, f, indent="\t")

with open(out_log, "w") as f:
    json.dump(generation_log, f, indent="\t")

# ── Summary ──────────────────────────────────────────────────────────────────

print(f"\n{'='*70}")
print(f"GENERATION SUMMARY")
print(f"{'='*70}")
print(f"  Enemies generated:           {len(generated_enemies)}")
print(f"  Enemy ID range:              {NEXT_ENEMY_ID} - {enemy_id - 1}")
print(f"  Projectile groups generated: {len(generated_proj_groups)}")
print(f"  Proj group ID range:         {NEXT_PROJ_GROUP_ID} - {proj_group_id - 1}")
print(f"  Loot tables generated:       {len(generated_loot_tables)}")
print(f"")

diff_counts = {}
for m in candidates:
    d = m["difficulty"]
    diff_counts[d] = diff_counts.get(d, 0) + 1
for d in ["low", "mid", "high", "boss"]:
    print(f"  {d:>5s} tier: {diff_counts.get(d, 0)} enemies")

print(f"\nOutput files:")
print(f"  {out_enemies}")
print(f"  {out_proj_groups}")
print(f"  {out_loot_tables}")
print(f"  {out_log}")
print(f"\nDone!")
