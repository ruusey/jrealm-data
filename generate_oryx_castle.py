import json

W, H = 40, 40

# Tile IDs
VOID = 0
BRIGHT_STONE = 49
STONE_PATH = 9
STONE_WALL = 16
WATER_DEEP = 40
WATER_SHALLOW = 25
CRYPT_FLOOR = 45
CRYPT_WALL = 47

# Initialize layers
base = [[VOID]*W for _ in range(H)]
coll = [[0]*W for _ in range(H)]

# Helper: is within grid
def inbounds(r, c):
    return 0 <= r < H and 0 <= c < W

# Step 1: Moat ring
# Shallow water edges at rows 3,36 and cols 3,36 (within the moat band)
# Deep water at rows 4,35 and cols 4,35
for r in range(H):
    for c in range(W):
        # Shallow water ring (outer moat edge)
        if (r == 3 or r == 36) and 3 <= c <= 36:
            base[r][c] = WATER_SHALLOW
        elif (c == 3 or c == 36) and 3 <= r <= 36:
            base[r][c] = WATER_SHALLOW
        # Deep water ring (inner moat)
        if (r == 4 or r == 35) and 4 <= c <= 35:
            base[r][c] = WATER_DEEP
        elif (c == 4 or c == 35) and 4 <= r <= 35:
            base[r][c] = WATER_DEEP

# Step 2: Castle walls at row/col 5 and 34
for r in range(H):
    for c in range(W):
        if (r == 5 or r == 34) and 5 <= c <= 34:
            base[r][c] = BRIGHT_STONE
            coll[r][c] = STONE_WALL
        elif (c == 5 or c == 34) and 5 <= r <= 34:
            base[r][c] = BRIGHT_STONE
            coll[r][c] = STONE_WALL

# Step 3: Fill castle interior (rows 6-33, cols 6-33) with bright stone floor
for r in range(6, 34):
    for c in range(6, 34):
        base[r][c] = BRIGHT_STONE

# Step 4: Bridge on south side, cols 18-20, rows 3-5 (crossing moat)
for r in range(3, 6):
    for c in range(18, 21):
        base[r][c] = STONE_PATH
        coll[r][c] = 0  # Clear any wall on bridge

# Also open the castle wall at the bridge entrance
for c in range(18, 21):
    coll[5][c] = 0  # Open the south wall for bridge entry

# Step 5: Corner room walls (interior walls on collision layer)
# NW room: rows 6-14, cols 6-14
# South wall of NW room at row 14, cols 6-14
for c in range(6, 15):
    coll[14][c] = STONE_WALL
# East wall of NW room at col 14, rows 6-14
for r in range(6, 15):
    coll[r][14] = STONE_WALL
# Doorway: 2-tile opening on south wall toward center (cols 10-11)
coll[14][10] = 0
coll[14][11] = 0
# Doorway: 2-tile opening on east wall toward center (rows 10-11)
coll[10][14] = 0
coll[11][14] = 0

# NE room: rows 6-14, cols 25-33
# South wall at row 14, cols 25-33
for c in range(25, 34):
    coll[14][c] = STONE_WALL
# West wall at col 25, rows 6-14
for r in range(6, 15):
    coll[r][25] = STONE_WALL
# Doorway on south wall (cols 28-29)
coll[14][28] = 0
coll[14][29] = 0
# Doorway on west wall (rows 10-11)
coll[10][25] = 0
coll[11][25] = 0

# SW room: rows 25-33, cols 6-14
# North wall at row 25, cols 6-14
for c in range(6, 15):
    coll[25][c] = STONE_WALL
# East wall at col 14, rows 25-33
for r in range(25, 34):
    coll[r][14] = STONE_WALL
# Doorway on north wall (cols 10-11)
coll[25][10] = 0
coll[25][11] = 0
# Doorway on east wall (rows 28-29)
coll[28][14] = 0
coll[29][14] = 0

# SE room: rows 25-33, cols 25-33
# North wall at row 25, cols 25-33
for c in range(25, 34):
    coll[25][c] = STONE_WALL
# West wall at col 25, rows 25-33
for r in range(25, 34):
    coll[r][25] = STONE_WALL
# Doorway on north wall (cols 28-29)
coll[25][28] = 0
coll[25][29] = 0
# Doorway on west wall (rows 28-29)
coll[28][25] = 0
coll[29][25] = 0

# Step 6: Boss chamber center (rows 16-23, cols 16-23)
# Crypt floor
for r in range(16, 24):
    for c in range(16, 24):
        base[r][c] = CRYPT_FLOOR

# Crypt walls around the boss chamber perimeter
for r in range(16, 24):
    for c in range(16, 24):
        if r == 16 or r == 23 or c == 16 or c == 23:
            coll[r][c] = CRYPT_WALL

# South doorway (2-tile opening at row 23, cols 19-20)
coll[23][19] = 0
coll[23][20] = 0

# Step 7: Stone path corridors connecting rooms to boss chamber
# Central north-south corridor (cols 19-20, from row 6 to row 33, excluding boss chamber interior)
for r in range(6, 34):
    for c in range(19, 21):
        if not (16 <= r <= 23 and 16 <= c <= 23):
            base[r][c] = STONE_PATH

# Central east-west corridor (rows 19-20, from col 6 to col 33, excluding boss chamber interior)
for r in range(19, 21):
    for c in range(6, 34):
        if not (16 <= r <= 23 and 16 <= c <= 23):
            base[r][c] = STONE_PATH

# Step 8: Read existing maps.json, append new entry, write back
maps_path = "C:/Users/ruuse/Documents/GitHub/jrealm-data/src/main/resources/data/maps.json"

with open(maps_path, 'r') as f:
    maps = json.load(f)

new_map = {
    "mapId": 25,
    "mapName": "Oryx_Castle",
    "mapKey": "dungeon.oryx_castle",
    "tileSize": 32,
    "width": 40,
    "height": 40,
    "terrainId": -1,
    "dungeonId": -1,
    "data": {
        "0": base,
        "1": coll
    }
}

maps.append(new_map)

with open(maps_path, 'w') as f:
    json.dump(maps, f, indent='\t', separators=(',', ': '))

print("Added Oryx_Castle as mapId=25")
print(f"Total maps: {len(maps)}")

# Print a visual representation
tile_chars = {
    0: '.',   # void
    49: '#',  # bright stone
    9: '=',   # stone path
    16: 'W',  # stone wall (on collision)
    40: '~',  # deep water
    25: '-',  # shallow water
    45: 'X',  # crypt floor
    47: 'C',  # crypt wall (on collision)
}

print("\n=== BASE LAYER ===")
for r in range(H):
    print(''.join(tile_chars.get(base[r][c], '?') for c in range(W)))

print("\n=== COLLISION LAYER (non-zero only) ===")
coll_chars = {0: '.', 16: 'W', 47: 'C'}
for r in range(H):
    print(''.join(coll_chars.get(coll[r][c], '?') for c in range(W)))
