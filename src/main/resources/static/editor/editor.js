const BASE = '/game-data';
const SCALE = 4;

// --- Admin Auth ---
let editorSessionToken = null;

document.getElementById('editor-login-btn').addEventListener('click', async () => {
  const email = document.getElementById('editor-email').value;
  const password = document.getElementById('editor-password').value;
  const errorEl = document.getElementById('editor-login-error');
  errorEl.textContent = '';
  try {
    const res = await fetch('/admin/account/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    editorSessionToken = data.token || data.data?.token;
    if (!editorSessionToken) throw new Error('No token received');
    document.getElementById('editor-login').style.display = 'none';
    document.getElementById('app').style.display = '';
  } catch (e) {
    errorEl.textContent = e.message;
  }
});

document.getElementById('editor-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('editor-login-btn').click();
});

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (editorSessionToken) h['Authorization'] = editorSessionToken;
  return h;
}

const SPRITE_SHEETS = [
  // Original sheets
  'rotmg-tiles-all.png','rotmg-tiles.png','rotmg-tiles-1.png','rotmg-tiles-2.png',
  'rotmg-tiles-1_0.png','rotmg-tiles-1_.png',
  'rotmg-misc.png','lofi_environment.png','lofi_obj.png',
  'lofi_char.png','lofi_dungeon_features.png','lofi_halls.png',
  'lofi_obj_packA.png','lofi_obj_packB.png',
  'rotmg-items.png','rotmg-items-1.png',
  'rotmg-projectiles.png','rotmg-abilities.png',
  'rotmg-bosses.png','rotmg-bosses-1.png','rotmg-bosses-1_.png',
  'rotmg-classes-0.png','rotmg-classes-1.png','rotmg-classes-2.png','rotmg-classes-3.png',
  'lofi_classes.png',
  // Backgrounds & misc
  'DarknessBackground.png','StarburstSpinner.png','cursors.png','stars.png',
  'sidesMask.png','innerMask.png','innerP1Mask.png','innerP2Mask.png',
  'theGoldenArcher.png','theGoldenArcherMask.png',
  // Hanami / Sakura
  'Hanami8x8chars.png','HanamiParts8x8.png',
  'SakuraEnvironment16x16.png','SakuraEnvironment8x8.png',
  // Lofi sheets
  'lofi.png','lofiChar.png','lofiChar2.png','lofiCharBig.png',
  'lofiEnvironment.png','lofiEnvironment2.png','lofiEnvironment3.png',
  'lofiGravestone.png','lofiInterface.png','lofiInterface2.png','lofiInterfaceBig.png',
  'lofiObj.png','lofiObj2.png','lofiObj3.png','lofiObj4.png','lofiObj40x40.png',
  'lofiObj5.png','lofiObj5b.png','lofiObj6.png','lofiObjBig.png',
  'lofiParts.png','lofiProjs.png','lofiProjsBig.png',
  // Lofi particles
  'lofiParticlesBeam.png','lofiParticlesElectric.png','lofiParticlesHolyBeam.png',
  'lofiParticlesMeteor.png','lofiParticlesShocker.png','lofiParticlesSkull.png',
  'lofiParticlesTelegraph.png',
  // Textiles
  'textile4x4.png','textile5x5.png','textile9x9.png','textile10x10.png',
  // Generic char sheets
  'chars8x8dBeach.png','chars8x8dEncounters.png','chars8x8dHero1.png',
  'chars8x8rBeach.png','chars8x8rEncounters.png','chars8x8rHero1.png','chars8x8rHero2.png',
  'chars8x8rHigh.png','chars8x8rLow1.png','chars8x8rLow2.png',
  'chars8x8rMid.png','chars8x8rMid2.png',
  'chars8x8rPets1.png','chars8x8rPets1Mask.png','chars8x8rPets2.png','chars8x8rPetsKaratePenguin.png',
  'chars16x8dEncounters.png','chars16x8rEncounters.png',
  'chars16x16dEncounters.png','chars16x16dEncounters2.png',
  'chars16x16dMountains1.png','chars16x16dMountains2.png','chars16x16rEncounters.png',
  // Dungeon sheets (d1-d3)
  'd1Chars16x16r.png','d1Chars8x8r.png','d1LofiObj.png','d1LofiObjBig.png',
  'd2Chars16x16r.png','d2LofiObj.png','d2LofiObjBig.png',
  'd3Chars16x16r.png','d3Chars8x8r.png','d3LofiObj.png','d3LofiObjBig.png',
  // Ancient Ruins
  'ancientRuinsChars16x16.png','ancientRuinsChars8x8.png',
  'ancientRuinsObjects16x16.png','ancientRuinsObjects8x8.png',
  // Archbishop
  'archbishopChars16x16.png','archbishopChars8x8.png',
  'archbishopObjects16x16.png','archbishopObjects64x64.png','archbishopObjects8x8.png',
  // Autumn Nexus
  'autumnNexusChars16x16.png','autumnNexusChars8x8.png',
  'autumnNexusObjects16x16.png','autumnNexusObjects8x8.png',
  // Battle Oryx
  'battleOryxChars16x16.png','battleOryxChars8x8.png',
  'battleOryxObjects16x16.png','battleOryxObjects8x8.png',
  // Buffed Bunny
  'buffedBunnyChars16x16.png','buffedBunnyObjects16x16.png','buffedBunnyObjects8x8.png',
  // Cnidarian Reef
  'cnidarianReefObjects16x16.png','cnidarianReefObjects8x8.png',
  // Crystal Cave
  'crystalCaveChars16x16.png','crystalCaveChars8x8.png',
  'crystalCaveObjects16x16.png','crystalCaveObjects8x8.png',
  // Cursed Library
  'cursedLibraryChars16x16.png','cursedLibraryChars8x8.png','cursedLibraryCharsAvalon16x16.png',
  'cursedLibraryObjects16x16.png','cursedLibraryObjects8x8.png',
  // Epic Hive
  'epicHiveChars16x16.png','epicHiveChars8x8.png',
  'epicHiveObjects16x16.png','epicHiveObjects8x8.png',
  // Fungal Cavern
  'fungalCavernChars16x16.png','fungalCavernChars8x8.png',
  'fungalCavernObjects16x16.png','fungalCavernObjects8x8.png',
  // Inner Workings
  'innerWorkingsChars16x16.png','innerWorkingsChars8x8.png',
  'innerWorkingsObjects16x16.png','innerWorkingsObjects8x8.png',
  // Lair of Draconis
  'lairOfDraconisChars16x16.png','lairOfDraconisChars8x8.png',
  'lairOfDraconisObjects16x16.png','lairOfDraconisObjects8x8.png',
  // Lair of Shaitan
  'lairOfShaitanChars16x16.png','lairOfShaitanObjects16x16.png','lairOfShaitanObjects8x8.png',
  // Lost Halls
  'lostHallsChars16x16.png','lostHallsChars8x8.png',
  'lostHallsObjects16x16.png','lostHallsObjects8x8.png',
  // Magic Woods
  'magicWoodsChars16x16.png','magicWoodsChars8x8.png',
  'magicWoodsObjects16x16.png','magicWoodsObjects8x8.png',
  // Mountain Temple
  'mountainTempleChars16x16.png','mountainTempleChars8x8.png',
  'mountainTempleObjects16x16.png','mountainTempleObjects8x8.png',
  // Oryx Horde
  'oryxHordeChars16x16.png','oryxHordeChars8x8.png',
  'oryxHordeObjects16x16.png','oryxHordeObjects8x8.png',
  // Oryx Sanctuary
  'oryxSanctuaryChars16x16.png','oryxSanctuaryChars32x32.png','oryxSanctuaryChars8x8.png',
  'oryxSanctuaryObjects16x16.png','oryxSanctuaryObjects32x32.png','oryxSanctuaryObjects8x8.png',
  // Parasite Den
  'parasiteDenChars16x16.png','parasiteDenChars8x8.png',
  'parasiteDenObjects16x16.png','parasiteDenObjects8x8.png',
  // Secluded Thicket
  'secludedThicketChars16x16.png','secludedThicketChars8x8.png',
  'secludedThicketObjects16x16.png','secludedThicketObjects8x8.png',
  // Summer Nexus
  'summerNexusChars16x16.png','summerNexusChars8x8.png',
  'summerNexusObjects16x16.png','summerNexusObjects8x8.png',
];

let tiles = [];
let terrains = [];
let items = [];
let projGroups = [];
let maps = [];
let images = {};
let selectedTile = null;
let selectedTerrain = null;
let selectedItem = null;
let selectedProjGroup = null;
let selectedMap = null;
let mapBrushTileId = -1;
let mapPainting = false;
let pickMode = false;
let dirtyTiles = false;
let dirtyTerrains = false;
let dirtyItems = false;
let dirtyProjGroups = false;
let dirtyMaps = false;
let enemies = [];
let selectedEnemy = null;
let dirtyEnemies = false;
let lootGroups = [];
let lootTables = [];
let selectedLootGroup = null;
let dirtyLootGroups = false;
let dirtyLootTables = false;
let animations = [];
let selectedAnim = null;
let dirtyAnimations = false;
let portals = [];
let selectedPortal = null;
let dirtyPortals = false;
let animPickingFrame = null; // {animName, frameIdx} when picking a frame from the sheet
let currentSheet = SPRITE_SHEETS[0];
let gridSize = 8;
let activeTab = 'tiles';

// DOM refs
const sheetSelect = document.getElementById('sheetSelect');
const gridSizeSelect = document.getElementById('gridSize');
const sheetCanvas = document.getElementById('sheetCanvas');
const sheetOverlay = document.getElementById('sheetOverlay');
const sheetInfo = document.getElementById('sheetInfo');
const hoverInfo = document.getElementById('hoverInfo');
const tileList = document.getElementById('tileList');
const tileCount = document.getElementById('tileCount');
const tileSearch = document.getElementById('tileSearch');
const tileDetail = document.getElementById('tileDetail');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');
const addTileBtn = document.getElementById('addTileBtn');
const pickBtn = document.getElementById('pickBtn');
const applyBtn = document.getElementById('applyBtn');
const deleteTileBtn = document.getElementById('deleteTileBtn');
const goToSheetBtn = document.getElementById('goToSheetBtn');

// ========== INIT ==========
async function init() {
  populateSheetSelect();
  await Promise.all([loadTiles(), loadTerrains(), loadItems(), loadProjGroups(), loadMaps(), loadEnemies(), loadLootData(), loadAnimations(), loadPortals(), loadImages()]);
  renderSheet();
  renderTileList();
  renderTerrainList();
  renderItemList();
  renderMapList();
  renderEnemyList();
  renderPgTabList();
  renderPortalList();
  bindEvents();

  // Enhance manual ID inputs with searchable dropdowns
  enhanceWithDropdown('dmgProjGroup', projGroupOptions);
  enhanceWithDropdown('enemyAttackId', projGroupOptions);
  enhanceWithDropdown('dpWallTile', tileOptions);
  enhanceWithDropdown('dpBossEnemy', enemyOptions);
}

function populateSheetSelect() {
  SPRITE_SHEETS.forEach(name => {
    sheetSelect.appendChild(new Option(name, name));
    ['detailSprite', 'itemSprite', 'pgSprite', 'enemySprite', 'pgDetailSprite', 'portalSprite'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.appendChild(new Option(name, name));
    });
  });
}

async function loadTiles() {
  tiles = await (await fetch(`${BASE}/tiles.json`)).json();
  tiles.sort((a, b) => a.tileId - b.tileId);
  tileCount.textContent = tiles.length;
}

async function loadTerrains() {
  terrains = await (await fetch(`${BASE}/terrains.json`)).json();
  terrains.sort((a, b) => a.terrainId - b.terrainId);
  document.getElementById('terrainCount').textContent = terrains.length;
}

async function loadItems() {
  items = await (await fetch(`${BASE}/game-items.json`)).json();
  items.sort((a, b) => a.itemId - b.itemId);
  document.getElementById('itemCount').textContent = items.length;
}

async function loadProjGroups() {
  projGroups = await (await fetch(`${BASE}/projectile-groups.json`)).json();
  projGroups.sort((a, b) => a.projectileGroupId - b.projectileGroupId);
}

async function loadMaps() {
  maps = await (await fetch(`${BASE}/maps.json`)).json();
  maps.sort((a, b) => a.mapId - b.mapId);
  document.getElementById('mapCount').textContent = maps.length;
}

async function loadEnemies() {
    enemies = await (await fetch(`${BASE}/enemies.json`)).json();
    enemies.sort((a, b) => a.enemyId - b.enemyId);
    document.getElementById('enemyCount').textContent = enemies.length;
}

async function loadAnimations() {
    animations = await (await fetch(`${BASE}/animations.json`)).json();
    animations.sort((a, b) => a.objectId - b.objectId);
    document.getElementById('animCount').textContent = animations.length;
}

async function loadLootData() {
    lootGroups = await (await fetch(`${BASE}/loot-groups.json`)).json();
    lootGroups.sort((a, b) => a.lootGroupId - b.lootGroupId);
    lootTables = await (await fetch(`${BASE}/loot-tables.json`)).json();
    lootTables.sort((a, b) => a.enemyId - b.enemyId);
    document.getElementById('lgCount').textContent = lootGroups.length;
    document.getElementById('ltCount').textContent = lootTables.length;
}

function getProjGroupById(id) { return projGroups.find(g => g.projectileGroupId === id); }

async function loadImages() {
  await Promise.all(SPRITE_SHEETS.map(name => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { images[name] = img; resolve(); };
    img.onerror = resolve;
    img.src = `${BASE}/${name}`;
  })));
}

function getTileById(id) { return tiles.find(t => t.tileId === id); }

// ========== SHEET RENDERING ==========
function renderSheet() {
  const img = images[currentSheet];
  if (!img) { sheetInfo.textContent = '(not loaded)'; return; }
  const w = img.width * SCALE, h = img.height * SCALE;
  sheetCanvas.width = w; sheetCanvas.height = h;
  sheetOverlay.width = w; sheetOverlay.height = h;

  const ctx = sheetCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);
  drawOverlay();

  const cols = Math.floor(img.width / gridSize), rows = Math.floor(img.height / gridSize);
  sheetInfo.textContent = `(${img.width}x${img.height}px, ${cols}x${rows} cells @ ${gridSize}px)`;
}

function drawOverlay() {
  const img = images[currentSheet];
  if (!img) return;
  const w = img.width * SCALE, h = img.height * SCALE;
  const ctx = sheetOverlay.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const gs = gridSize * SCALE;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // Highlight assigned tiles on this sheet
  const ss = gridSize;
  tiles.forEach(t => {
    if (t.spriteKey !== currentSheet) return;
    const px = t.col * ss * SCALE, py = t.row * ss * SCALE, sz = ss * SCALE;
    const isSel = selectedTile && selectedTile.tileId === t.tileId;
    if (isSel) {
      ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, sz - 2, sz - 2);
      ctx.fillStyle = 'rgba(233,69,96,0.3)';
      ctx.fillRect(px, py, sz, sz);
    } else {
      ctx.fillStyle = 'rgba(100,200,255,0.15)';
      ctx.fillRect(px, py, sz, sz);
    }
  });
}

// ========== TILE PREVIEW ==========
function drawTilePreview(canvas, tile) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = images[tile.spriteKey];
  if (!img) return;
  const ss = gridSize;
  ctx.drawImage(img, tile.col * ss, tile.row * ss, ss, ss, 0, 0, canvas.width, canvas.height);
}

// ========== TILE LIST ==========
function renderTileList(filter = '') {
  tileList.innerHTML = '';
  const lower = filter.toLowerCase();
  tiles.forEach(t => {
    if (lower && !t.name.toLowerCase().includes(lower) && !String(t.tileId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedTile && selectedTile.tileId === t.tileId ? ' selected' : '');

    const cvs = document.createElement('canvas'); cvs.width = 32; cvs.height = 32;
    drawTilePreview(cvs, t);

    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = t.tileId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = t.name;
    const flags = document.createElement('span'); flags.className = 'tile-flags';
    if (t.data && t.data.hasCollision) flags.innerHTML += '<span class="flag flag-c">C</span>';
    if (t.data && t.data.slows) flags.innerHTML += '<span class="flag flag-s">S</span>';
    if (t.data && t.data.damaging) flags.innerHTML += '<span class="flag flag-d">D</span>';

    row.append(cvs, id, name, flags);
    row.addEventListener('click', () => selectTile(t));
    tileList.appendChild(row);
  });
}

function selectTile(tile) {
  selectedTile = tile;
  pickMode = false;
  pickBtn.classList.remove('active');
  pickBtn.textContent = 'Pick from Sheet';
  renderTileList(tileSearch.value);
  showDetail(tile);
  // Don't force-switch sheet - just update overlay to show selection if on same sheet
  drawOverlay();
}

function showDetail(tile) {
  tileDetail.style.display = 'block';
  document.getElementById('detailTitle').textContent = `Tile: ${tile.name} (ID ${tile.tileId})`;
  document.getElementById('detailId').value = tile.tileId;
  document.getElementById('detailName').value = tile.name;
  document.getElementById('detailSprite').value = tile.spriteKey;
  document.getElementById('detailRow').value = tile.row;
  document.getElementById('detailCol').value = tile.col;
  document.getElementById('detailSize').value = tile.size || 32;
  document.getElementById('detailCollision').checked = !!(tile.data && tile.data.hasCollision);
  document.getElementById('detailSlows').checked = !!(tile.data && tile.data.slows);
  document.getElementById('detailDamaging').checked = !!(tile.data && tile.data.damaging);
  updatePreview();
}

function updatePreview() {
  if (!selectedTile) return;
  const cvs = document.getElementById('previewCanvas');
  const spriteKey = document.getElementById('detailSprite').value;
  const row = parseInt(document.getElementById('detailRow').value) || 0;
  const col = parseInt(document.getElementById('detailCol').value) || 0;
  drawTilePreview(cvs, { spriteKey, row, col });
  document.getElementById('previewLabel').textContent = `[${spriteKey} @ r${row} c${col}]`;
}

function applyDetail() {
  if (!selectedTile) return;
  const tile = getTileById(selectedTile.tileId);
  if (!tile) return;
  tile.name = document.getElementById('detailName').value;
  tile.spriteKey = document.getElementById('detailSprite').value;
  tile.row = parseInt(document.getElementById('detailRow').value) || 0;
  tile.col = parseInt(document.getElementById('detailCol').value) || 0;
  tile.size = parseInt(document.getElementById('detailSize').value) || 32;
  if (!tile.data) tile.data = {};
  tile.data.hasCollision = document.getElementById('detailCollision').checked ? 1 : 0;
  tile.data.slows = document.getElementById('detailSlows').checked ? 1 : 0;
  tile.data.damaging = document.getElementById('detailDamaging').checked ? 1 : 0;
  selectedTile = tile;
  markDirty('tiles');
  renderTileList(tileSearch.value);
  drawOverlay();
}

function addTile() {
  const maxId = tiles.reduce((max, t) => Math.max(max, t.tileId), -1);
  const newTile = { tileId: maxId + 1, name: 'New_Tile_' + (maxId + 1), spriteKey: currentSheet, row: 0, col: 0, size: 32, data: { hasCollision: 0, slows: 0, damaging: 0 } };
  tiles.push(newTile);
  tiles.sort((a, b) => a.tileId - b.tileId);
  tileCount.textContent = tiles.length;
  markDirty('tiles');
  selectTile(newTile);
}

function deleteTile() {
  if (!selectedTile) return;
  if (!confirm(`Delete tile ${selectedTile.tileId} (${selectedTile.name})?`)) return;
  tiles = tiles.filter(t => t.tileId !== selectedTile.tileId);
  tileCount.textContent = tiles.length;
  selectedTile = null;
  tileDetail.style.display = 'none';
  markDirty('tiles');
  renderTileList(tileSearch.value);
  drawOverlay();
}

function goToSheet() {
  if (!selectedTile) return;
  if (selectedTile.spriteKey !== currentSheet) {
    currentSheet = selectedTile.spriteKey;
    sheetSelect.value = currentSheet;
    renderSheet();
  }
  const ss = gridSize;
  const px = selectedTile.col * ss * SCALE, py = selectedTile.row * ss * SCALE;
  const scroll = document.querySelector('.sheet-scroll');
  scroll.scrollTo({ left: px - scroll.clientWidth / 2, top: py - scroll.clientHeight / 2, behavior: 'smooth' });
}

// ========== TERRAIN EDITOR ==========
function renderTerrainList(filter = '') {
  const list = document.getElementById('terrainSelectList');
  list.innerHTML = '';
  const lower = (filter || '').toLowerCase();
  terrains.forEach(t => {
    if (lower && !t.name.toLowerCase().includes(lower) && !String(t.terrainId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedTerrain && selectedTerrain.terrainId === t.terrainId ? ' selected' : '');
    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = t.terrainId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = t.name;
    const count = document.createElement('span'); count.style.cssText = 'color:#888;font-size:11px';
    const tileIds = t.tileGroups && t.tileGroups[0] ? t.tileGroups[0].tileIds : [];
    count.textContent = `(${tileIds.length} tiles)`;
    row.append(id, name, count);
    row.addEventListener('click', () => selectTerrain(t));
    list.appendChild(row);
  });
}

function selectTerrain(terrain) {
  selectedTerrain = terrain;
  document.getElementById('terrainSelectList').style.display = 'none';
  document.querySelector('#terrainsTab .tile-header').style.display = 'none';
  renderTerrainDetail();
}

function deselectTerrain() {
  selectedTerrain = null;
  document.getElementById('terrainDetail').style.display = 'none';
  document.getElementById('terrainSelectList').style.display = '';
  document.querySelector('#terrainsTab .tile-header').style.display = '';
  renderTerrainList(document.getElementById('terrainSearch').value);
}

function renderTerrainDetail() {
  const t = selectedTerrain;
  if (!t) return;
  const detail = document.getElementById('terrainDetail');
  detail.style.display = 'block';
  document.getElementById('terrainTitle').textContent = `${t.name} (ID ${t.terrainId})`;
  document.getElementById('terrainDims').textContent = `${t.width}x${t.height} tiles, tileSize: ${t.tileSize}`;

  const container = document.getElementById('terrainTileGroups');
  container.innerHTML = '';

  const group = t.tileGroups && t.tileGroups[0];
  if (!group) { container.textContent = 'No tile groups'; return; }

  group.tileIds.forEach((tileId, idx) => {
    const tile = getTileById(tileId);
    const rarity = group.rarities ? (group.rarities[String(tileId)] || 0) : 0;

    const row = document.createElement('div');
    row.className = 'tg-tile-row';

    const cvs = document.createElement('canvas'); cvs.width = 24; cvs.height = 24;
    if (tile) drawTilePreview(cvs, tile);

    const idSpan = document.createElement('span'); idSpan.className = 'tile-id'; idSpan.textContent = tileId;
    const nameSpan = document.createElement('span'); nameSpan.className = 'tg-name';
    nameSpan.textContent = tile ? tile.name : '(unknown)';

    const rarityInput = document.createElement('input');
    rarityInput.type = 'number'; rarityInput.min = 0; rarityInput.max = 1; rarityInput.step = 0.01;
    rarityInput.value = rarity;
    rarityInput.title = 'Rarity (0-1)';
    rarityInput.addEventListener('change', () => {
      if (!group.rarities) group.rarities = {};
      group.rarities[String(tileId)] = parseFloat(rarityInput.value) || 0;
      markDirty('terrains');
    });

    // Replace button - opens tile picker
    const replaceBtn = document.createElement('button');
    replaceBtn.className = 'btn-add'; replaceBtn.textContent = 'Replace';
    replaceBtn.style.cssText = 'padding:2px 8px;font-size:11px';
    replaceBtn.addEventListener('click', () => {
      openTilePicker((newId) => {
        if (newId === tileId) return;
        group.tileIds[idx] = newId;
        const oldRarity = group.rarities ? (group.rarities[String(tileId)] || 0) : 0;
        if (group.rarities) delete group.rarities[String(tileId)];
        if (!group.rarities) group.rarities = {};
        group.rarities[String(newId)] = oldRarity;
        markDirty('terrains');
        renderTerrainDetail();
      });
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'tg-remove'; removeBtn.textContent = '\u00d7'; removeBtn.title = 'Remove tile';
    removeBtn.addEventListener('click', () => {
      group.tileIds.splice(idx, 1);
      if (group.rarities) delete group.rarities[String(tileId)];
      markDirty('terrains');
      renderTerrainDetail();
    });

    // Click tile name to jump to it in tile editor
    nameSpan.style.cursor = 'pointer';
    nameSpan.title = 'Click to view in Tiles tab';
    nameSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tile) {
        switchTab('tiles');
        selectTile(tile);
        const el = tileList.querySelector(`[data-tile-id="${tile.tileId}"]`);
        if (el) el.scrollIntoView({ block: 'center' });
      }
    });

    row.append(cvs, idSpan, nameSpan, rarityInput, replaceBtn, removeBtn);
    container.appendChild(row);
  });
}

function addTileToTerrain() {
  if (!selectedTerrain) return;
  const group = selectedTerrain.tileGroups && selectedTerrain.tileGroups[0];
  if (!group) return;
  const rarity = parseFloat(document.getElementById('terrainAddRarity').value) || 0.05;
  openTilePicker((tileId) => {
    if (group.tileIds.includes(tileId)) { alert('Tile ' + tileId + ' already in this terrain'); return; }
    group.tileIds.push(tileId);
    if (!group.rarities) group.rarities = {};
    group.rarities[String(tileId)] = rarity;
    markDirty('terrains');
    renderTerrainDetail();
  });
}

// ========== ITEMS EDITOR ==========
function drawSpritePreview(canvas, spriteKey, row, col) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = images[spriteKey];
  if (!img) return;
  const ss = gridSize;
  ctx.drawImage(img, col * ss, row * ss, ss, ss, 0, 0, canvas.width, canvas.height);
}

function addItem() {
  const maxId = items.reduce((max, i) => Math.max(max, i.itemId), 0);
  const newItem = {
    itemId: maxId + 1, name: 'New_Item_' + (maxId + 1),
    description: '', spriteKey: 'rotmg-items.png', row: 0, col: 0,
    spriteSize: 8, tier: 0, slotType: 0, rateOfFire: 1,
    stats: { hp: 0, mp: 0, def: 0, att: 0, spd: 0, dex: 0, vit: 0, wis: 0 },
    damage: { min: 0, max: 0, projectileGroupId: -1 },
    effect: { effectId: 0, mpCost: 0, duration: 0, cooldownDuration: 0, self: false }
  };
  items.push(newItem);
  items.sort((a, b) => a.itemId - b.itemId);
  document.getElementById('itemCount').textContent = items.length;
  markDirty('items');
  selectItem(newItem);
}

function renderItemList(filter = '') {
  const list = document.getElementById('itemListView');
  list.innerHTML = '';
  const lower = (filter || '').toLowerCase();
  items.forEach(item => {
    if (lower && !item.name.toLowerCase().includes(lower) && !String(item.itemId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedItem && selectedItem.itemId === item.itemId ? ' selected' : '');
    const cvs = document.createElement('canvas'); cvs.width = 28; cvs.height = 28;
    drawSpritePreview(cvs, item.spriteKey, item.row, item.col);
    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = item.itemId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = item.name;
    const tier = document.createElement('span'); tier.style.cssText = 'color:#888;font-size:11px';
    tier.textContent = `T${item.tier}`;
    row.append(cvs, id, name, tier);
    row.addEventListener('click', () => selectItem(item));
    list.appendChild(row);
  });
}

function selectItem(item) {
  selectedItem = item;
  selectedProjGroup = null;
  document.getElementById('itemListView').style.display = 'none';
  document.querySelector('#itemsTab .tile-header').style.display = 'none';
  document.getElementById('projGroupDetail').style.display = 'none';
  showItemDetail(item);
}

function deselectItem() {
  selectedItem = null;
  document.getElementById('itemDetail').style.display = 'none';
  document.getElementById('projGroupDetail').style.display = 'none';
  document.getElementById('itemListView').style.display = '';
  document.querySelector('#itemsTab .tile-header').style.display = '';
  renderItemList(document.getElementById('itemSearch').value);
}

function showItemDetail(item) {
  const d = document.getElementById('itemDetail');
  d.style.display = 'block';
  document.getElementById('itemTitle').textContent = `${item.name} (ID ${item.itemId})`;
  document.getElementById('itemId').value = item.itemId;
  document.getElementById('itemName').value = item.name || '';
  document.getElementById('itemDesc').value = item.description || '';
  document.getElementById('itemSprite').value = item.spriteKey || '';
  document.getElementById('itemRow').value = item.row || 0;
  document.getElementById('itemCol').value = item.col || 0;
  document.getElementById('itemTier').value = item.tier || 0;
  document.getElementById('itemSlot').value = item.targetSlot != null ? item.targetSlot : -1;
  document.getElementById('itemClass').value = item.targetClass != null ? item.targetClass : -4;
  document.getElementById('itemFame').value = item.fameBonus || 0;
  document.getElementById('itemConsumable').checked = !!item.consumable;

  const s = item.stats || {};
  document.getElementById('statHp').value = s.hp || 0;
  document.getElementById('statMp').value = s.mp || 0;
  document.getElementById('statAtt').value = s.att || 0;
  document.getElementById('statDef').value = s.def || 0;
  document.getElementById('statSpd').value = s.spd || 0;
  document.getElementById('statDex').value = s.dex || 0;
  document.getElementById('statVit').value = s.vit || 0;
  document.getElementById('statWis').value = s.wis || 0;

  const dmg = item.damage || {};
  document.getElementById('dmgMin').value = dmg.min || 0;
  document.getElementById('dmgMax').value = dmg.max || 0;
  document.getElementById('dmgProjGroup').value = dmg.projectileGroupId != null ? dmg.projectileGroupId : -1;

  const eff = item.effect || {};
  document.getElementById('effectId').value = eff.effectId || 0;
  document.getElementById('effectMp').value = eff.mpCost || 0;
  document.getElementById('effectDur').value = eff.duration || 0;
  document.getElementById('effectCd').value = eff.cooldownDuration || 0;
  document.getElementById('effectSelf').checked = !!eff.self;
}

function applyItemDetail() {
  if (!selectedItem) return;
  const item = items.find(i => i.itemId === selectedItem.itemId);
  if (!item) return;
  item.name = document.getElementById('itemName').value;
  item.description = document.getElementById('itemDesc').value;
  item.spriteKey = document.getElementById('itemSprite').value;
  item.row = parseInt(document.getElementById('itemRow').value) || 0;
  item.col = parseInt(document.getElementById('itemCol').value) || 0;
  item.tier = parseInt(document.getElementById('itemTier').value) || 0;
  item.targetSlot = parseInt(document.getElementById('itemSlot').value);
  item.targetClass = parseInt(document.getElementById('itemClass').value);
  item.fameBonus = parseInt(document.getElementById('itemFame').value) || 0;
  item.consumable = document.getElementById('itemConsumable').checked;

  if (!item.stats) item.stats = {};
  item.stats.hp = parseInt(document.getElementById('statHp').value) || 0;
  item.stats.mp = parseInt(document.getElementById('statMp').value) || 0;
  item.stats.att = parseInt(document.getElementById('statAtt').value) || 0;
  item.stats.def = parseInt(document.getElementById('statDef').value) || 0;
  item.stats.spd = parseInt(document.getElementById('statSpd').value) || 0;
  item.stats.dex = parseInt(document.getElementById('statDex').value) || 0;
  item.stats.vit = parseInt(document.getElementById('statVit').value) || 0;
  item.stats.wis = parseInt(document.getElementById('statWis').value) || 0;

  const dmgMin = parseInt(document.getElementById('dmgMin').value) || 0;
  const dmgMax = parseInt(document.getElementById('dmgMax').value) || 0;
  const pgId = parseInt(document.getElementById('dmgProjGroup').value);
  if (dmgMax > 0 || pgId >= 0) {
    if (!item.damage) item.damage = {};
    item.damage.min = dmgMin;
    item.damage.max = dmgMax;
    item.damage.projectileGroupId = pgId;
  }

  const effId = parseInt(document.getElementById('effectId').value) || 0;
  const mpCost = parseInt(document.getElementById('effectMp').value) || 0;
  if (effId > 0 || mpCost > 0) {
    if (!item.effect) item.effect = {};
    item.effect.effectId = effId;
    item.effect.mpCost = mpCost;
    item.effect.duration = parseInt(document.getElementById('effectDur').value) || 0;
    item.effect.cooldownDuration = parseInt(document.getElementById('effectCd').value) || 0;
    item.effect.self = document.getElementById('effectSelf').checked;
  }

  selectedItem = item;
  markDirty('items');
}

// ========== PROJECTILE GROUP EDITOR ==========
const POS_MODES = { 0: 'TARGET_PLAYER', 1: 'RELATIVE', 2: 'ABSOLUTE' };
const FLAG_NAMES = {
  0:'INVISIBLE', 1:'HEALING', 2:'PARALYZED', 3:'STUNNED', 4:'SPEEDY', 5:'HEAL',
  6:'INVINCIBLE', 8:'NONE', 9:'TELEPORT', 10:'PLAYER_PROJ', 11:'DAZED',
  12:'PARAMETRIC', 13:'INV_PARAMETRIC', 14:'DAMAGING', 15:'STASIS',
  16:'CURSED', 17:'POISONED', 18:'ARMORED', 19:'BERSERK'
};

// Searchable dropdown picker for ID fields.
// `options` = [{id, label}], `onSelect` = callback(id), `currentVal` = pre-selected id
function createSearchableSelect(options, onSelect, currentVal, placeholder) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:inline-block';
  const input = document.createElement('input');
  input.type = 'text'; input.placeholder = placeholder || 'Search...';
  input.style.cssText = 'width:160px;font-size:11px;padding:2px 4px;background:#1a1820;color:#e0d8c8;border:1px solid #333';
  const cur = options.find(o => o.id === currentVal);
  if (cur) input.value = cur.label;
  const list = document.createElement('div');
  list.style.cssText = 'display:none;position:absolute;top:100%;left:0;z-index:999;max-height:200px;overflow-y:auto;background:#1a1820;border:1px solid #555;width:240px';

  function renderOptions(filter) {
    list.innerHTML = '';
    const lower = (filter || '').toLowerCase();
    let count = 0;
    for (const opt of options) {
      if (lower && !opt.label.toLowerCase().includes(lower) && !String(opt.id).includes(lower)) continue;
      if (++count > 50) break;
      const row = document.createElement('div');
      row.style.cssText = 'padding:3px 6px;font-size:11px;cursor:pointer;color:#e0d8c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      row.textContent = opt.label;
      row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        input.value = opt.label;
        list.style.display = 'none';
        onSelect(opt.id);
      });
      row.addEventListener('mouseenter', () => { row.style.background = '#333'; });
      row.addEventListener('mouseleave', () => { row.style.background = ''; });
      list.appendChild(row);
    }
    if (count === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:4px 6px;font-size:10px;color:#888';
      empty.textContent = 'No matches';
      list.appendChild(empty);
    }
  }

  input.addEventListener('focus', () => { renderOptions(input.value); list.style.display = 'block'; });
  input.addEventListener('input', () => { renderOptions(input.value); list.style.display = 'block'; });
  input.addEventListener('blur', () => { setTimeout(() => { list.style.display = 'none'; }, 150); });
  wrapper.append(input, list);
  return wrapper;
}

// Checkbox grid for projectile flags
function createFlagCheckboxes(currentFlags, onChange) {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-wrap:wrap;gap:2px 8px;padding:2px 0';
  const sorted = Object.entries(FLAG_NAMES).sort((a,b) => parseInt(a[0]) - parseInt(b[0]));
  for (const [id, name] of sorted) {
    const flagId = parseInt(id);
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:2px;font-size:10px;color:#c8a86e;cursor:pointer;white-space:nowrap';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = (currentFlags || []).includes(flagId);
    cb.style.cssText = 'margin:0;cursor:pointer';
    cb.addEventListener('change', () => {
      const flags = [];
      container.querySelectorAll('input[type=checkbox]').forEach((box, i) => {
        if (box.checked) flags.push(parseInt(sorted[i][0]));
      });
      onChange(flags);
    });
    label.append(cb, document.createTextNode(`${name}(${id})`));
    container.appendChild(label);
  }
  return container;
}

// Helper to build option lists from loaded data
function itemOptions() { return items.map(i => ({id: i.itemId, label: `[${i.itemId}] ${i.name || 'Unnamed'}`})); }
function enemyOptions() { return enemies.map(e => ({id: e.enemyId, label: `[${e.enemyId}] ${e.name || 'Unnamed'}`})); }
function projGroupOptions() { return [{id: -1, label: '[-1] None/Scripted'}, ...projGroups.map(g => ({id: g.projectileGroupId, label: `[${g.projectileGroupId}] PG ${g.projectileGroupId}`}))]; }
function tileOptions() { return tiles.map(t => ({id: t.tileId, label: `[${t.tileId}] ${t.name || 'Tile ' + t.tileId}`})); }
function lootGroupOptions() { return lootGroups.map(g => ({id: g.lootGroupId, label: `[${g.lootGroupId}] ${g.name || 'Group ' + g.lootGroupId}`})); }

// Enhance a number input by adding a searchable dropdown next to it.
// The hidden input keeps working for data read/write; the dropdown sets its value.
function enhanceWithDropdown(inputId, optionsFn) {
  const input = document.getElementById(inputId);
  if (!input || input._enhanced) return;
  input._enhanced = true;
  input.style.width = '50px';
  const picker = createSearchableSelect(optionsFn(), (id) => {
    input.value = id;
    input.dispatchEvent(new Event('change'));
  }, parseInt(input.value), 'Search...');
  input.parentElement.appendChild(picker);
}

// Show a searchable picker dialog and return the selected ID via callback
function showPickerDialog(title, optionsFn, callback) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:#1a1820;border:1px solid #555;border-radius:6px;padding:12px;min-width:280px;max-height:400px;display:flex;flex-direction:column';
  const header = document.createElement('div');
  header.style.cssText = 'font-size:13px;color:#c8a86e;margin-bottom:8px;font-weight:bold';
  header.textContent = title;
  const searchInput = document.createElement('input');
  searchInput.type = 'text'; searchInput.placeholder = 'Type to search...';
  searchInput.style.cssText = 'width:100%;font-size:12px;padding:4px 6px;background:#12101a;color:#e0d8c8;border:1px solid #333;margin-bottom:6px;box-sizing:border-box';
  const listDiv = document.createElement('div');
  listDiv.style.cssText = 'overflow-y:auto;max-height:280px';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel'; cancelBtn.className = 'btn-pick';
  cancelBtn.style.cssText = 'margin-top:8px;align-self:flex-end';
  cancelBtn.addEventListener('click', () => document.body.removeChild(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });

  function renderList(filter) {
    listDiv.innerHTML = '';
    const lower = (filter || '').toLowerCase();
    const opts = optionsFn();
    let count = 0;
    for (const opt of opts) {
      if (lower && !opt.label.toLowerCase().includes(lower) && !String(opt.id).includes(lower)) continue;
      if (++count > 80) break;
      const row = document.createElement('div');
      row.style.cssText = 'padding:4px 8px;font-size:12px;cursor:pointer;color:#e0d8c8;border-bottom:1px solid #222';
      row.textContent = opt.label;
      row.addEventListener('click', () => { document.body.removeChild(overlay); callback(opt.id); });
      row.addEventListener('mouseenter', () => { row.style.background = '#333'; });
      row.addEventListener('mouseleave', () => { row.style.background = ''; });
      listDiv.appendChild(row);
    }
  }
  searchInput.addEventListener('input', () => renderList(searchInput.value));
  renderList('');
  dialog.append(header, searchInput, listDiv, cancelBtn);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  searchInput.focus();
}

function viewProjGroup() {
  const pgId = parseInt(document.getElementById('dmgProjGroup').value);
  if (pgId < 0) return;
  const group = getProjGroupById(pgId);
  if (!group) { alert('Projectile group ' + pgId + ' not found'); return; }
  selectedProjGroup = group;
  document.getElementById('itemDetail').style.display = 'none';
  showProjGroupDetail(group);
}

function closeProjGroup() {
  selectedProjGroup = null;
  document.getElementById('projGroupDetail').style.display = 'none';
  if (selectedItem) {
    document.getElementById('itemDetail').style.display = 'block';
  }
}

function showProjGroupDetail(group) {
  const d = document.getElementById('projGroupDetail');
  d.style.display = 'block';
  document.getElementById('projGroupTitle').textContent = `Projectile Group ${group.projectileGroupId}`;
  document.getElementById('pgId').value = group.projectileGroupId;
  document.getElementById('pgSprite').value = group.spriteKey || '';
  document.getElementById('pgRow').value = group.row || 0;
  document.getElementById('pgCol').value = group.col || 0;
  document.getElementById('pgAngleOffset').value = group.angleOffset || '';

  const cvs = document.getElementById('pgPreviewCanvas');
  drawSpritePreview(cvs, group.spriteKey, group.row || 0, group.col || 0);

  renderProjList(group);
}

function makeLabeledField(labelText, key, val, obj, dirtyKey) {
  const lbl = document.createElement('label');
  const span = document.createElement('span');
  span.textContent = labelText;
  lbl.appendChild(span);
  const inp = document.createElement('input');
  inp.type = key === 'angle' ? 'text' : 'number';
  inp.value = val != null ? val : '';
  if (key !== 'angle' && key !== 'flags') inp.step = 'any';
  inp.addEventListener('change', () => {
    if (key === 'angle') { obj[key] = inp.value; }
    else if (key === 'flags') { obj[key] = inp.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)); }
    else { obj[key] = parseFloat(inp.value) || 0; }
    markDirty(dirtyKey);
  });
  lbl.appendChild(inp);
  return lbl;
}

function renderProjList(group) {
  const container = document.getElementById('pgProjectiles');
  container.innerHTML = '';
  if (!group.projectiles) return;

  group.projectiles.forEach((p, idx) => {
    // Row 1: Mode, Angle, Damage, Range, Speed, remove
    const row1 = document.createElement('div');
    row1.className = 'proj-row';

    const numBadge = document.createElement('span');
    numBadge.className = 'proj-num';
    numBadge.textContent = '#' + (idx + 1);

    const modeLbl = document.createElement('label');
    const modeSpan = document.createElement('span'); modeSpan.textContent = 'Mode';
    modeLbl.appendChild(modeSpan);
    const modeSelect = document.createElement('select');
    [0, 2].forEach(m => { const opt = new Option(POS_MODES[m] || m, m); opt.selected = p.positionMode === m; modeSelect.appendChild(opt); });
    modeSelect.addEventListener('change', () => { p.positionMode = parseInt(modeSelect.value); markDirty('projGroups'); });
    modeLbl.appendChild(modeSelect);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'tg-remove'; removeBtn.textContent = '\u00d7';
    removeBtn.addEventListener('click', () => { group.projectiles.splice(idx, 1); markDirty('projGroups'); renderProjList(group); });

    row1.append(numBadge, modeLbl,
      makeLabeledField('Angle', 'angle', p.angle, p, 'projGroups'),
      makeLabeledField('Damage', 'damage', p.damage, p, 'projGroups'),
      makeLabeledField('Range', 'range', p.range, p, 'projGroups'),
      makeLabeledField('Speed', 'magnitude', p.magnitude, p, 'projGroups'),
      removeBtn);
    container.appendChild(row1);

    // Row 2: Size, Amplitude, Frequency, Flags
    const row2 = document.createElement('div');
    row2.className = 'proj-row row2';
    row2.style.borderTop = 'none';
    row2.style.marginTop = '-4px';
    row2.style.paddingTop = '0';
    const spacer = document.createElement('span'); spacer.textContent = '';
    row2.append(spacer,
      makeLabeledField('Size', 'size', p.size, p, 'projGroups'),
      makeLabeledField('Amplitude', 'amplitude', p.amplitude, p, 'projGroups'),
      makeLabeledField('Frequency', 'frequency', p.frequency, p, 'projGroups'));
    container.appendChild(row2);
    const flagRow = document.createElement('div');
    flagRow.className = 'proj-row row2';
    flagRow.style.cssText = 'border-top:none;margin-top:-4px;padding:2px 6px';
    const flagLabel = document.createElement('span');
    flagLabel.style.cssText = 'font-size:10px;color:#aaa;margin-right:4px';
    flagLabel.textContent = 'Flags:';
    flagRow.append(flagLabel, createFlagCheckboxes(p.flags, (flags) => { p.flags = flags; markDirty('projGroups'); }));
    container.appendChild(flagRow);
  });
}

function addProjectile() {
  if (!selectedProjGroup) return;
  if (!selectedProjGroup.projectiles) selectedProjGroup.projectiles = [];
  selectedProjGroup.projectiles.push({
    projectileId: selectedProjGroup.projectiles.length,
    positionMode: 0, angle: '0', range: 6, size: 8, magnitude: 5.0,
    damage: 10, amplitude: 0, frequency: 0, flags: [0, 10]
  });
  markDirty('projGroups');
  renderProjList(selectedProjGroup);
}

function applyProjGroup() {
  if (!selectedProjGroup) return;
  const g = getProjGroupById(selectedProjGroup.projectileGroupId);
  if (!g) return;
  g.spriteKey = document.getElementById('pgSprite').value;
  g.row = parseInt(document.getElementById('pgRow').value) || 0;
  g.col = parseInt(document.getElementById('pgCol').value) || 0;
  g.angleOffset = document.getElementById('pgAngleOffset').value || undefined;
  markDirty('projGroups');
  const cvs = document.getElementById('pgPreviewCanvas');
  drawSpritePreview(cvs, g.spriteKey, g.row, g.col);
}

// ========== ENEMIES EDITOR ==========
function drawEnemySpritePreview(canvas, enemy) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = images[enemy.spriteKey];
    if (!img) return;
    const ss = enemy.spriteSize || 8;
    ctx.drawImage(img, (enemy.col || 0) * ss, (enemy.row || 0) * ss, ss, ss, 0, 0, canvas.width, canvas.height);
}

function renderEnemyList(filter) {
    const list = document.getElementById('enemyListView');
    list.innerHTML = '';
    const lower = (filter || '').toLowerCase();
    enemies.forEach(enemy => {
        if (lower && !enemy.name.toLowerCase().includes(lower) && !String(enemy.enemyId).includes(lower)) return;
        const row = document.createElement('div');
        row.className = 'tile-row' + (selectedEnemy && selectedEnemy.enemyId === enemy.enemyId ? ' selected' : '');
        const cvs = document.createElement('canvas'); cvs.width = 32; cvs.height = 32;
        drawEnemySpritePreview(cvs, enemy);
        const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = enemy.enemyId;
        const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = enemy.name;
        const info = document.createElement('span'); info.style.cssText = 'color:#888;font-size:11px';
        info.textContent = `HP:${enemy.health} XP:${enemy.xp}`;
        const phaseCount = document.createElement('span'); phaseCount.style.cssText = 'color:#8cf;font-size:10px';
        phaseCount.textContent = enemy.phases ? `${enemy.phases.length}P` : '';
        row.append(cvs, id, name, info, phaseCount);
        row.addEventListener('click', () => selectEnemy(enemy));
        list.appendChild(row);
    });
}

function selectEnemy(enemy) {
    selectedEnemy = enemy;
    document.getElementById('enemyListView').style.display = 'none';
    document.querySelector('#enemiesTab .tile-header').style.display = 'none';
    showEnemyDetail(enemy);
}

function deselectEnemy() {
    selectedEnemy = null;
    document.getElementById('enemyDetail').style.display = 'none';
    document.getElementById('enemyListView').style.display = '';
    document.querySelector('#enemiesTab .tile-header').style.display = '';
    renderEnemyList(document.getElementById('enemySearch').value);
}

function showEnemyDetail(enemy) {
    const d = document.getElementById('enemyDetail');
    d.style.display = 'block';
    document.getElementById('enemyTitle').textContent = `${enemy.name} (ID ${enemy.enemyId})`;
    document.getElementById('enemyId').value = enemy.enemyId;
    document.getElementById('enemyName').value = enemy.name || '';
    document.getElementById('enemySprite').value = enemy.spriteKey || '';
    document.getElementById('enemyRow').value = enemy.row || 0;
    document.getElementById('enemyCol').value = enemy.col || 0;
    document.getElementById('enemySpriteSize').value = enemy.spriteSize || 8;
    document.getElementById('enemySize').value = enemy.size || 32;
    document.getElementById('enemyAttackId').value = enemy.attackId != null ? enemy.attackId : -1;
    // Show context for attackId: -1 = scripted, >= 0 = projectile group
    const atkId = enemy.attackId != null ? enemy.attackId : -1;
    const atkInfo = document.getElementById('attackIdInfo');
    const atkBtn = document.getElementById('editAttackIdBtn');
    if (atkId === -1) {
        atkInfo.textContent = '(Server-scripted attack)';
        atkInfo.style.color = '#c8a86e';
        atkBtn.style.display = 'none';
    } else {
        const pg = getProjGroupById(atkId);
        atkInfo.textContent = pg ? '(Proj Group exists)' : '(Group not found!)';
        atkInfo.style.color = pg ? '#4a4' : '#e44';
        atkBtn.style.display = 'inline-block';
    }
    document.getElementById('enemyXp').value = enemy.xp || 0;
    document.getElementById('enemyHealth').value = enemy.health || 0;
    document.getElementById('enemyMaxSpeed').value = enemy.maxSpeed || 0;
    document.getElementById('enemyChaseRange').value = enemy.chaseRange || 0;
    document.getElementById('enemyAttackRange').value = enemy.attackRange || 0;
    const s = enemy.stats || {};
    document.getElementById('eStatHp').value = s.hp || 0;
    document.getElementById('eStatMp').value = s.mp || 0;
    document.getElementById('eStatAtt').value = s.att || 0;
    document.getElementById('eStatDef').value = s.def || 0;
    document.getElementById('eStatSpd').value = s.spd || 0;
    document.getElementById('eStatDex').value = s.dex || 0;
    document.getElementById('eStatVit').value = s.vit || 0;
    document.getElementById('eStatWis').value = s.wis || 0;
    updateEnemyPreview();
    renderEnemyLootSection(enemy);
    renderPhases(enemy);
}

function updateEnemyPreview() {
    if (!selectedEnemy) return;
    const cvs = document.getElementById('enemyPreviewCanvas');
    const spriteKey = document.getElementById('enemySprite').value;
    const row = parseInt(document.getElementById('enemyRow').value) || 0;
    const col = parseInt(document.getElementById('enemyCol').value) || 0;
    const ss = parseInt(document.getElementById('enemySpriteSize').value) || 8;
    const ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    const img = images[spriteKey];
    if (img) ctx.drawImage(img, col * ss, row * ss, ss, ss, 0, 0, cvs.width, cvs.height);
    document.getElementById('enemyPreviewLabel').textContent = `[${spriteKey} @ r${row} c${col} ${ss}px]`;
}

function applyEnemyDetail() {
    if (!selectedEnemy) return;
    const enemy = enemies.find(e => e.enemyId === selectedEnemy.enemyId);
    if (!enemy) return;
    enemy.name = document.getElementById('enemyName').value;
    enemy.spriteKey = document.getElementById('enemySprite').value;
    enemy.row = parseInt(document.getElementById('enemyRow').value) || 0;
    enemy.col = parseInt(document.getElementById('enemyCol').value) || 0;
    enemy.spriteSize = parseInt(document.getElementById('enemySpriteSize').value) || 8;
    enemy.size = parseInt(document.getElementById('enemySize').value) || 32;
    enemy.attackId = parseInt(document.getElementById('enemyAttackId').value);
    enemy.xp = parseInt(document.getElementById('enemyXp').value) || 0;
    enemy.health = parseInt(document.getElementById('enemyHealth').value) || 0;
    enemy.maxSpeed = parseFloat(document.getElementById('enemyMaxSpeed').value) || 0;
    enemy.chaseRange = parseFloat(document.getElementById('enemyChaseRange').value) || 0;
    enemy.attackRange = parseFloat(document.getElementById('enemyAttackRange').value) || 0;
    if (!enemy.stats) enemy.stats = {};
    enemy.stats.hp = parseInt(document.getElementById('eStatHp').value) || 0;
    enemy.stats.mp = parseInt(document.getElementById('eStatMp').value) || 0;
    enemy.stats.att = parseInt(document.getElementById('eStatAtt').value) || 0;
    enemy.stats.def = parseInt(document.getElementById('eStatDef').value) || 0;
    enemy.stats.spd = parseInt(document.getElementById('eStatSpd').value) || 0;
    enemy.stats.dex = parseInt(document.getElementById('eStatDex').value) || 0;
    enemy.stats.vit = parseInt(document.getElementById('eStatVit').value) || 0;
    enemy.stats.wis = parseInt(document.getElementById('eStatWis').value) || 0;
    selectedEnemy = enemy;
    markDirty('enemies');
    renderEnemyList(document.getElementById('enemySearch').value);
}

function addEnemy() {
    const maxId = enemies.reduce((max, e) => Math.max(max, e.enemyId), 0);
    const newEnemy = {
        enemyId: maxId + 1, name: 'New_Enemy_' + (maxId + 1),
        spriteKey: 'lofi_char.png', row: 0, col: 0, spriteSize: 8,
        size: 32, attackId: -1, xp: 100, health: 100,
        maxSpeed: 1.4, chaseRange: 390, attackRange: 210,
        stats: { hp: 100, def: 0, dex: 5 },
        phases: []
    };
    enemies.push(newEnemy);
    enemies.sort((a, b) => a.enemyId - b.enemyId);
    document.getElementById('enemyCount').textContent = enemies.length;
    markDirty('enemies');
    selectEnemy(newEnemy);
}

function deleteEnemy() {
    if (!selectedEnemy) return;
    if (!confirm(`Delete enemy ${selectedEnemy.enemyId} (${selectedEnemy.name})?`)) return;
    enemies = enemies.filter(e => e.enemyId !== selectedEnemy.enemyId);
    document.getElementById('enemyCount').textContent = enemies.length;
    selectedEnemy = null;
    deselectEnemy();
    markDirty('enemies');
}

// --- Phase Editor ---
const MOVEMENT_TYPES = ['CHASE','ORBIT','STRAFE','CHARGE','FLEE','WANDER','ANCHOR','FIGURE_EIGHT'];
const MOVEMENT_FIELDS = {
    CHASE: ['speed'],
    ORBIT: ['speed','radius','direction'],
    STRAFE: ['speed','preferredRange'],
    CHARGE: ['speed','chargeDistanceMin','pauseMs'],
    FLEE: ['speed','fleeRange'],
    WANDER: ['speed'],
    ANCHOR: ['speed','anchorRadius'],
    FIGURE_EIGHT: ['speed','radius'],
};

function makePhaseInput(label, value, onChange, type, step) {
    const lbl = document.createElement('label');
    lbl.textContent = label + ': ';
    const inp = document.createElement('input');
    inp.type = type || 'text';
    inp.value = value;
    if (step) inp.step = step;
    inp.addEventListener('change', () => { onChange(inp.value); markDirty('enemies'); });
    lbl.appendChild(inp);
    return lbl;
}

function renderPhases(enemy) {
    const container = document.getElementById('enemyPhases');
    container.innerHTML = '';
    if (!enemy.phases) enemy.phases = [];

    enemy.phases.forEach((phase, idx) => {
        const card = document.createElement('div');
        card.className = 'phase-card';

        // Header
        const header = document.createElement('div');
        header.className = 'phase-header';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'phase-name';
        nameSpan.textContent = '#' + (idx + 1) + ': ' + (phase.name || 'unnamed');
        const hpSpan = document.createElement('span');
        hpSpan.className = 'phase-hp';
        hpSpan.textContent = 'HP<=' + ((phase.hpThreshold || 1.0) * 100).toFixed(0) + '%';

        const actions = document.createElement('span');
        actions.className = 'phase-actions';
        if (idx > 0) {
            const up = document.createElement('button'); up.textContent = '\u25B2'; up.title = 'Move up';
            up.addEventListener('click', (e) => { e.stopPropagation(); enemy.phases.splice(idx - 1, 0, enemy.phases.splice(idx, 1)[0]); markDirty('enemies'); renderPhases(enemy); });
            actions.appendChild(up);
        }
        if (idx < enemy.phases.length - 1) {
            const dn = document.createElement('button'); dn.textContent = '\u25BC'; dn.title = 'Move down';
            dn.addEventListener('click', (e) => { e.stopPropagation(); enemy.phases.splice(idx + 1, 0, enemy.phases.splice(idx, 1)[0]); markDirty('enemies'); renderPhases(enemy); });
            actions.appendChild(dn);
        }
        const rm = document.createElement('button'); rm.textContent = '\u00D7'; rm.title = 'Remove';
        rm.addEventListener('click', (e) => { e.stopPropagation(); enemy.phases.splice(idx, 1); markDirty('enemies'); renderPhases(enemy); });
        actions.appendChild(rm);

        header.append(nameSpan, hpSpan, actions);
        header.addEventListener('click', () => card.classList.toggle('collapsed'));

        // Body
        const body = document.createElement('div');
        body.className = 'phase-body';

        // Phase name + threshold fields
        const topFields = document.createElement('div');
        topFields.className = 'phase-move-fields';
        topFields.appendChild(makePhaseInput('Name', phase.name || '', (v) => { phase.name = v; nameSpan.textContent = '#' + (idx+1) + ': ' + v; }, 'text'));
        topFields.appendChild(makePhaseInput('HP Threshold', phase.hpThreshold || 1.0, (v) => { phase.hpThreshold = parseFloat(v) || 1.0; hpSpan.textContent = 'HP<=' + (phase.hpThreshold*100).toFixed(0) + '%'; }, 'number', '0.01'));
        body.appendChild(topFields);

        // Movement editor
        renderMovementEditor(body, phase);

        // Attack patterns editor
        renderAttackPatternsEditor(body, phase, enemy);

        card.append(header, body);
        container.appendChild(card);
    });
}

function renderMovementEditor(body, phase) {
    const h = document.createElement('h5'); h.textContent = 'Movement';
    body.appendChild(h);

    if (!phase.movement) phase.movement = { type: 'CHASE', speed: 1.4 };
    const mov = phase.movement;

    const wrap = document.createElement('div');
    wrap.className = 'phase-move-fields';

    // Type dropdown
    const typeLbl = document.createElement('label');
    typeLbl.textContent = 'Type: ';
    const typeSel = document.createElement('select');
    MOVEMENT_TYPES.forEach(t => { const o = new Option(t, t); o.selected = mov.type === t; typeSel.appendChild(o); });
    typeLbl.appendChild(typeSel);
    wrap.appendChild(typeLbl);

    const fieldsDiv = document.createElement('div');
    fieldsDiv.className = 'phase-move-fields';
    fieldsDiv.style.gridColumn = '1 / -1';

    function rebuildFields() {
        fieldsDiv.innerHTML = '';
        const fields = MOVEMENT_FIELDS[mov.type] || ['speed'];
        fields.forEach(f => {
            if (f === 'direction') {
                const lbl = document.createElement('label'); lbl.textContent = 'Direction: ';
                const sel = document.createElement('select');
                ['CW','CCW'].forEach(d => { const o = new Option(d,d); o.selected = mov.direction === d; sel.appendChild(o); });
                sel.addEventListener('change', () => { mov.direction = sel.value; markDirty('enemies'); });
                lbl.appendChild(sel);
                fieldsDiv.appendChild(lbl);
            } else {
                fieldsDiv.appendChild(makePhaseInput(f, mov[f] != null ? mov[f] : 0, (v) => { mov[f] = parseFloat(v) || 0; }, 'number', '0.1'));
            }
        });
    }

    typeSel.addEventListener('change', () => { mov.type = typeSel.value; markDirty('enemies'); rebuildFields(); });
    rebuildFields();
    wrap.appendChild(fieldsDiv);
    body.appendChild(wrap);
}

// Navigate to the Projectiles tab and open a specific group by ID
function navigateToProjGroup(pgId) {
    const group = getProjGroupById(pgId);
    if (!group) { alert('Projectile group ' + pgId + ' not found'); return; }
    switchTab('projgroups');
    selectPgTab(group);
}

function renderAttackPatternsEditor(body, phase, enemy) {
    const h = document.createElement('h5'); h.textContent = 'Attacks';
    body.appendChild(h);

    if (!phase.attacks) phase.attacks = [];
    const container = document.createElement('div');

    phase.attacks.forEach((atk, atkIdx) => {
        const row = document.createElement('div');
        row.className = 'attack-row';
        const badge = document.createElement('span'); badge.style.cssText = 'color:#c8a86e;font-weight:600';
        badge.textContent = '#' + (atkIdx + 1);

        function mkField(label, key, width) {
            const lbl = document.createElement('label'); lbl.textContent = label;
            const inp = document.createElement('input'); inp.type = 'number';
            inp.value = atk[key] != null ? atk[key] : '';
            inp.style.width = (width || 50) + 'px';
            inp.addEventListener('change', () => { atk[key] = parseFloat(inp.value) || 0; markDirty('enemies'); });
            lbl.appendChild(inp);
            return lbl;
        }

        const predLbl = document.createElement('label'); predLbl.textContent = 'Pred ';
        const predCb = document.createElement('input'); predCb.type = 'checkbox'; predCb.checked = !!atk.predictive;
        predCb.addEventListener('change', () => { atk.predictive = predCb.checked; markDirty('enemies'); });
        predLbl.appendChild(predCb);

        const rmBtn = document.createElement('button'); rmBtn.className = 'tg-remove'; rmBtn.textContent = '\u00D7';
        rmBtn.addEventListener('click', () => { phase.attacks.splice(atkIdx, 1); markDirty('enemies'); renderPhases(enemy); });

        // PG field with searchable dropdown + "Edit" link
        const pgWrapper = document.createElement('div');
        pgWrapper.style.cssText = 'display:flex;align-items:flex-end;gap:4px';
        const pgLabel = document.createElement('span');
        pgLabel.style.cssText = 'font-size:11px;color:#aaa';
        pgLabel.textContent = 'PG:';
        pgWrapper.appendChild(pgLabel);
        pgWrapper.appendChild(createSearchableSelect(projGroupOptions(), (id) => {
          atk.projectileGroupId = id; markDirty('enemies');
        }, atk.projectileGroupId, 'Proj Group...'));
        const editPgBtn = document.createElement('button');
        editPgBtn.className = 'btn-pick';
        editPgBtn.textContent = 'Edit';
        editPgBtn.style.cssText = 'font-size:10px;padding:2px 6px;height:22px';
        editPgBtn.addEventListener('click', () => navigateToProjGroup(atk.projectileGroupId));
        pgWrapper.appendChild(editPgBtn);

        row.append(badge,
            pgWrapper,
            mkField('Cooldown:', 'cooldownMs', 50),
            mkField('Burst:', 'burstCount', 35),
            mkField('Burst Delay:', 'burstDelayMs', 42),
            mkField('Angle Offset:', 'angleOffsetPerBurst', 42),
            mkField('Min Range:', 'minRange', 42),
            mkField('Max Range:', 'maxRange', 45),
            predLbl, rmBtn
        );
        container.appendChild(row);
    });

    const addBtn = document.createElement('button'); addBtn.className = 'btn-add';
    addBtn.textContent = '+ Attack'; addBtn.style.cssText = 'margin-top:3px;font-size:11px';
    addBtn.addEventListener('click', () => {
        phase.attacks.push({ projectileGroupId: 0, cooldownMs: 1000, burstCount: 1, burstDelayMs: 100 });
        markDirty('enemies');
        renderPhases(enemy);
    });
    container.appendChild(addBtn);
    body.appendChild(container);
}

function addPhase() {
    if (!selectedEnemy) return;
    if (!selectedEnemy.phases) selectedEnemy.phases = [];
    selectedEnemy.phases.push({
        name: 'phase_' + (selectedEnemy.phases.length + 1),
        hpThreshold: selectedEnemy.phases.length === 0 ? 1.0 : 0.5,
        movement: { type: 'CHASE', speed: 1.4 },
        attacks: []
    });
    markDirty('enemies');
    renderPhases(selectedEnemy);
}

// ========== PROJECTILE GROUPS TAB ==========
let selectedPgTab = null;

function renderPgTabList(filter) {
  const list = document.getElementById('pgListView');
  list.innerHTML = '';
  const lower = (filter || '').toLowerCase();
  document.getElementById('pgCount').textContent = projGroups.length;
  projGroups.forEach(group => {
    const idStr = String(group.projectileGroupId);
    const key = (group.spriteKey || '') + ' r' + (group.row||0) + ' c' + (group.col||0);
    if (lower && !idStr.includes(lower) && !key.toLowerCase().includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedPgTab && selectedPgTab.projectileGroupId === group.projectileGroupId ? ' selected' : '');
    const cvs = document.createElement('canvas'); cvs.width = 32; cvs.height = 32;
    drawSpritePreview(cvs, group.spriteKey, group.row || 0, group.col || 0);
    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = group.projectileGroupId;
    const info = document.createElement('span'); info.className = 'tile-name';
    info.textContent = (group.spriteKey || '?') + ' r' + (group.row||0) + 'c' + (group.col||0);
    const projCount = document.createElement('span'); projCount.style.cssText = 'color:#8cf;font-size:10px';
    projCount.textContent = (group.projectiles ? group.projectiles.length : 0) + ' proj';
    const ao = document.createElement('span'); ao.style.cssText = 'color:#888;font-size:10px';
    ao.textContent = group.angleOffset ? group.angleOffset : '';
    row.append(cvs, id, info, projCount, ao);
    row.addEventListener('click', () => selectPgTab(group));
    list.appendChild(row);
  });
}

function selectPgTab(group) {
  selectedPgTab = group;
  document.getElementById('pgListView').style.display = 'none';
  document.querySelector('#projgroupsTab .tile-header').style.display = 'none';
  showPgTabDetail(group);
}

function deselectPgTab() {
  selectedPgTab = null;
  document.getElementById('pgDetail').style.display = 'none';
  document.getElementById('pgListView').style.display = '';
  document.querySelector('#projgroupsTab .tile-header').style.display = '';
  renderPgTabList(document.getElementById('pgSearch').value);
}

function showPgTabDetail(group) {
  const d = document.getElementById('pgDetail');
  d.style.display = 'block';
  document.getElementById('pgDetailTitle').textContent = 'Projectile Group ' + group.projectileGroupId;
  document.getElementById('pgDetailId').value = group.projectileGroupId;
  document.getElementById('pgDetailSprite').value = group.spriteKey || '';
  document.getElementById('pgDetailRow').value = group.row || 0;
  document.getElementById('pgDetailCol').value = group.col || 0;
  document.getElementById('pgDetailAngleOffset').value = group.angleOffset || '';
  updatePgTabPreview();
  renderPgTabProjList(group);
}

function updatePgTabPreview() {
  if (!selectedPgTab) return;
  const cvs = document.getElementById('pgDetailPreview');
  const spriteKey = document.getElementById('pgDetailSprite').value;
  const row = parseInt(document.getElementById('pgDetailRow').value) || 0;
  const col = parseInt(document.getElementById('pgDetailCol').value) || 0;
  drawSpritePreview(cvs, spriteKey, row, col);
  document.getElementById('pgDetailPreviewLabel').textContent = '[' + spriteKey + ' @ r' + row + ' c' + col + ']';
}

function renderPgTabProjList(group) {
  const container = document.getElementById('pgDetailProjectiles');
  container.innerHTML = '';
  if (!group.projectiles) return;

  group.projectiles.forEach((p, idx) => {
    const numBadge = document.createElement('span');
    numBadge.className = 'proj-num';
    numBadge.textContent = '#' + (idx + 1);

    const modeLbl = document.createElement('label');
    const modeSpan = document.createElement('span'); modeSpan.textContent = 'Mode';
    modeLbl.appendChild(modeSpan);
    const modeSelect = document.createElement('select');
    [0, 2].forEach(m => { const opt = new Option(POS_MODES[m] || m, m); opt.selected = p.positionMode === m; modeSelect.appendChild(opt); });
    modeSelect.addEventListener('change', () => { p.positionMode = parseInt(modeSelect.value); markDirty('projGroups'); });
    modeLbl.appendChild(modeSelect);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'tg-remove'; removeBtn.textContent = '\u00d7';
    removeBtn.addEventListener('click', () => { group.projectiles.splice(idx, 1); markDirty('projGroups'); renderPgTabProjList(group); });

    const row1 = document.createElement('div');
    row1.className = 'proj-row';
    row1.append(numBadge, modeLbl,
      makeLabeledField('Angle', 'angle', p.angle, p, 'projGroups'),
      makeLabeledField('Damage', 'damage', p.damage, p, 'projGroups'),
      makeLabeledField('Range', 'range', p.range, p, 'projGroups'),
      makeLabeledField('Speed', 'magnitude', p.magnitude, p, 'projGroups'),
      removeBtn);
    container.appendChild(row1);

    const row2 = document.createElement('div');
    row2.className = 'proj-row row2';
    row2.style.borderTop = 'none'; row2.style.marginTop = '-4px'; row2.style.paddingTop = '0';
    const spacer = document.createElement('span');
    row2.append(spacer,
      makeLabeledField('Size', 'size', p.size, p, 'projGroups'),
      makeLabeledField('Amplitude', 'amplitude', p.amplitude, p, 'projGroups'),
      makeLabeledField('Frequency', 'frequency', p.frequency, p, 'projGroups'));
    container.appendChild(row2);
    const flagRow = document.createElement('div');
    flagRow.className = 'proj-row row2';
    flagRow.style.cssText = 'border-top:none;margin-top:-4px;padding:2px 6px';
    const flagLabel = document.createElement('span');
    flagLabel.style.cssText = 'font-size:10px;color:#aaa;margin-right:4px';
    flagLabel.textContent = 'Flags:';
    flagRow.append(flagLabel, createFlagCheckboxes(p.flags, (flags) => { p.flags = flags; markDirty('projGroups'); }));
    container.appendChild(flagRow);
  });
}

function applyPgTabDetail() {
  if (!selectedPgTab) return;
  const g = getProjGroupById(selectedPgTab.projectileGroupId);
  if (!g) return;
  g.spriteKey = document.getElementById('pgDetailSprite').value;
  g.row = parseInt(document.getElementById('pgDetailRow').value) || 0;
  g.col = parseInt(document.getElementById('pgDetailCol').value) || 0;
  g.angleOffset = document.getElementById('pgDetailAngleOffset').value || undefined;
  markDirty('projGroups');
  updatePgTabPreview();
  renderPgTabList(document.getElementById('pgSearch').value);
}

function addPgTab() {
  const maxId = projGroups.reduce((max, g) => Math.max(max, g.projectileGroupId), 0);
  const newGroup = {
    projectileGroupId: maxId + 1, row: 0, col: 0,
    spriteKey: 'rotmg-projectiles.png', angleOffset: '0',
    projectiles: [{ projectileId: maxId + 1, positionMode: 0, angle: '0', range: 150, size: 16, magnitude: 5.0, damage: 25, amplitude: 0, frequency: 0, flags: [0] }]
  };
  projGroups.push(newGroup);
  projGroups.sort((a, b) => a.projectileGroupId - b.projectileGroupId);
  markDirty('projGroups');
  selectPgTab(newGroup);
}

function deletePgTab() {
  if (!selectedPgTab) return;
  if (!confirm('Delete projectile group ' + selectedPgTab.projectileGroupId + '?')) return;
  projGroups = projGroups.filter(g => g.projectileGroupId !== selectedPgTab.projectileGroupId);
  selectedPgTab = null;
  deselectPgTab();
  markDirty('projGroups');
}

function addPgTabProjectile() {
  if (!selectedPgTab) return;
  if (!selectedPgTab.projectiles) selectedPgTab.projectiles = [];
  selectedPgTab.projectiles.push({
    projectileId: selectedPgTab.projectileGroupId, positionMode: 0, angle: '0',
    range: 150, size: 16, magnitude: 5.0, damage: 25, amplitude: 0, frequency: 0, flags: [0]
  });
  markDirty('projGroups');
  renderPgTabProjList(selectedPgTab);
}

// ========== MAPS EDITOR ==========
const MAP_TILE_PX = 16; // pixel size per cell on the map canvas

function getMapType(m) {
  if (m.data) return 'static';
  if (m.dungeonId >= 0 && m.dungeonParams) return 'dungeon';
  if (m.terrainId >= 0) return 'terrain';
  return 'unknown';
}

function addMap() {
  // Prompt for dimensions
  const widthStr = window.prompt('Map width (tiles):', '32');
  if (widthStr === null) return;
  const heightStr = window.prompt('Map height (tiles):', widthStr);
  if (heightStr === null) return;
  const w = Math.max(1, parseInt(widthStr) || 32);
  const h = Math.max(1, parseInt(heightStr) || 32);
  const maxId = maps.reduce((max, m) => Math.max(max, m.mapId), 0);
  const data = new Array(w * h).fill(0);
  const newMap = {
    mapId: maxId + 1, mapName: 'New_Map_' + (maxId + 1),
    width: w, height: h, tileSize: 32,
    data: data
  };
  maps.push(newMap);
  maps.sort((a, b) => a.mapId - b.mapId);
  document.getElementById('mapCount').textContent = maps.length;
  markDirty('maps');
  selectMap(newMap);
}

function renderMapList(filter = '') {
  const list = document.getElementById('mapListView');
  list.innerHTML = '';
  const lower = (filter || '').toLowerCase();
  maps.forEach(m => {
    if (lower && !m.mapName.toLowerCase().includes(lower) && !String(m.mapId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedMap && selectedMap.mapId === m.mapId ? ' selected' : '');
    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = m.mapId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = m.mapName;
    const type = getMapType(m);
    const badge = document.createElement('span');
    badge.className = 'map-type-badge map-type-' + type;
    badge.textContent = type;
    const dims = document.createElement('span'); dims.style.cssText = 'color:#888;font-size:11px';
    dims.textContent = `${m.width}x${m.height}`;
    row.append(id, name, badge, dims);
    row.addEventListener('click', () => selectMap(m));
    list.appendChild(row);
  });
}

function selectMap(m) {
  selectedMap = m;
  mapBrushTileId = -1;
  document.getElementById('mapListView').style.display = 'none';
  document.querySelector('#mapsTab .tile-header').style.display = 'none';
  showMapDetail(m);
}

function deselectMap() {
  selectedMap = null;
  document.getElementById('mapDetail').style.display = 'none';
  document.getElementById('mapListView').style.display = '';
  document.querySelector('#mapsTab .tile-header').style.display = '';
  renderMapList(document.getElementById('mapSearch').value);
}

function showMapDetail(m) {
  const detail = document.getElementById('mapDetail');
  detail.style.display = 'flex';
  document.getElementById('mapTitle').textContent = `${m.mapName} (ID ${m.mapId})`;
  document.getElementById('mapInfo').textContent = `${m.width}x${m.height}, tileSize: ${m.tileSize}`;

  const type = getMapType(m);
  const dungeonEditor = document.getElementById('dungeonParamsEditor');
  const staticEditor = document.getElementById('staticMapEditor');

  dungeonEditor.style.display = 'none';
  staticEditor.style.display = 'none';

  if (type === 'static') {
    staticEditor.style.display = 'flex';
    staticEditor.style.flexDirection = 'column';
    staticEditor.style.flex = '1';
    staticEditor.style.minHeight = '0';
    updateMapBrushInfo();
    renderMapCanvas();
    renderStaticSpawnList();
    cancelPlaceEnemy();
  } else if (type === 'dungeon') {
    dungeonEditor.style.display = 'block';
    showDungeonParams(m);
  } else if (type === 'terrain') {
    const terrain = terrains.find(t => t.terrainId === m.terrainId);
    document.getElementById('mapInfo').textContent += ` | Terrain: ${terrain ? terrain.name : m.terrainId} (edit in Terrains tab)`;
  }
}

// ---- Dungeon params editor ----
function showDungeonParams(m) {
  const dp = m.dungeonParams || {};
  document.getElementById('dpMinRooms').value = dp.minRooms || 10;
  document.getElementById('dpMaxRooms').value = dp.maxRooms || 20;
  document.getElementById('dpMinRoomW').value = dp.minRoomWidth || 6;
  document.getElementById('dpMaxRoomW').value = dp.maxRoomWidth || 14;
  document.getElementById('dpMinRoomH').value = dp.minRoomHeight || 6;
  document.getElementById('dpMaxRoomH').value = dp.maxRoomHeight || 14;
  document.getElementById('dpWallTile').value = dp.wallTileId || 0;
  document.getElementById('dpBossEnemy').value = dp.bossEnemyId != null ? dp.bossEnemyId : -1;

  const shapes = dp.shapeTemplates || [];
  document.querySelectorAll('#dpShapes input').forEach(cb => {
    cb.checked = shapes.includes(cb.value);
  });
  const halls = dp.hallwayStyles || [];
  document.querySelectorAll('#dpHalls input').forEach(cb => {
    cb.checked = halls.includes(cb.value);
  });

  renderDungeonFloorTiles(dp);
}

function renderDungeonFloorTiles(dp) {
  const container = document.getElementById('dpFloorTiles');
  container.innerHTML = '';
  const floorIds = dp.floorTileIds || [];
  floorIds.forEach((tileId, idx) => {
    const tile = getTileById(tileId);
    const row = document.createElement('div');
    row.className = 'tg-tile-row';
    const cvs = document.createElement('canvas'); cvs.width = 24; cvs.height = 24;
    if (tile) drawTilePreview(cvs, tile);
    const idSpan = document.createElement('span'); idSpan.className = 'tile-id'; idSpan.textContent = tileId;
    const nameSpan = document.createElement('span'); nameSpan.className = 'tg-name';
    nameSpan.textContent = tile ? tile.name : '(unknown)';
    const replaceBtn = document.createElement('button');
    replaceBtn.className = 'btn-add'; replaceBtn.textContent = 'Replace';
    replaceBtn.style.cssText = 'padding:2px 8px;font-size:11px';
    replaceBtn.addEventListener('click', () => {
      openTilePicker((newId) => {
        floorIds[idx] = newId;
        markDirty('maps');
        renderDungeonFloorTiles(dp);
      });
    });
    const removeBtn = document.createElement('button');
    removeBtn.className = 'tg-remove'; removeBtn.textContent = '\u00d7';
    removeBtn.addEventListener('click', () => {
      floorIds.splice(idx, 1);
      markDirty('maps');
      renderDungeonFloorTiles(dp);
    });
    row.append(cvs, idSpan, nameSpan, replaceBtn, removeBtn);
    container.appendChild(row);
  });
}

function applyDungeonParams() {
  if (!selectedMap) return;
  const m = maps.find(x => x.mapId === selectedMap.mapId);
  if (!m) return;
  if (!m.dungeonParams) m.dungeonParams = {};
  const dp = m.dungeonParams;
  dp.minRooms = parseInt(document.getElementById('dpMinRooms').value) || 10;
  dp.maxRooms = parseInt(document.getElementById('dpMaxRooms').value) || 20;
  dp.minRoomWidth = parseInt(document.getElementById('dpMinRoomW').value) || 6;
  dp.maxRoomWidth = parseInt(document.getElementById('dpMaxRoomW').value) || 14;
  dp.minRoomHeight = parseInt(document.getElementById('dpMinRoomH').value) || 6;
  dp.maxRoomHeight = parseInt(document.getElementById('dpMaxRoomH').value) || 14;
  dp.wallTileId = parseInt(document.getElementById('dpWallTile').value) || 0;
  const boss = parseInt(document.getElementById('dpBossEnemy').value);
  if (boss >= 0) dp.bossEnemyId = boss;
  else delete dp.bossEnemyId;

  dp.shapeTemplates = [];
  document.querySelectorAll('#dpShapes input:checked').forEach(cb => dp.shapeTemplates.push(cb.value));
  dp.hallwayStyles = [];
  document.querySelectorAll('#dpHalls input:checked').forEach(cb => dp.hallwayStyles.push(cb.value));
  if (dp.hallwayStyles.length === 0) delete dp.hallwayStyles;

  markDirty('maps');
}

function addDungeonFloorTile() {
  if (!selectedMap || !selectedMap.dungeonParams) return;
  openTilePicker((tileId) => {
    if (!selectedMap.dungeonParams.floorTileIds) selectedMap.dungeonParams.floorTileIds = [];
    if (selectedMap.dungeonParams.floorTileIds.includes(tileId)) { alert('Tile already in floor list'); return; }
    selectedMap.dungeonParams.floorTileIds.push(tileId);
    markDirty('maps');
    renderDungeonFloorTiles(selectedMap.dungeonParams);
  });
}

// ---- Static map layer canvas editor ----
function getMapLayer() {
  return document.getElementById('mapLayerSelect').value;
}

function updateMapBrushInfo() {
  const info = document.getElementById('mapBrushInfo');
  if (mapBrushTileId < 0) {
    info.innerHTML = 'Brush: (none)';
  } else {
    const tile = getTileById(mapBrushTileId);
    const cvs = document.createElement('canvas'); cvs.width = 20; cvs.height = 20;
    if (tile) drawTilePreview(cvs, tile);
    info.innerHTML = '';
    info.appendChild(document.createTextNode('Brush: '));
    info.appendChild(cvs);
    info.appendChild(document.createTextNode(` ${tile ? tile.name : mapBrushTileId}`));
  }
}

function renderMapCanvas() {
  if (!selectedMap || !selectedMap.data) return;
  const m = selectedMap;
  const layer = getMapLayer();
  const layerData = m.data[layer];
  if (!layerData) return;

  const w = m.width * MAP_TILE_PX;
  const h = m.height * MAP_TILE_PX;
  const canvas = document.getElementById('mapCanvas');
  const overlay = document.getElementById('mapOverlayCanvas');
  canvas.width = w; canvas.height = h;
  overlay.width = w; overlay.height = h;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, w, h);

  // Draw base layer always
  const baseData = m.data['0'];
  if (baseData) {
    for (let r = 0; r < m.height && r < baseData.length; r++) {
      for (let c = 0; c < m.width && c < baseData[r].length; c++) {
        const tileId = baseData[r][c];
        const tile = getTileById(tileId);
        if (tile) {
          const img = images[tile.spriteKey];
          if (img) {
            const ss = tile.size || 32;
            // Use spriteKey's native tile size for source coords
            const srcSize = gridSize;
            ctx.drawImage(img, tile.col * srcSize, tile.row * srcSize, srcSize, srcSize,
              c * MAP_TILE_PX, r * MAP_TILE_PX, MAP_TILE_PX, MAP_TILE_PX);
          }
        }
      }
    }
  }

  // Draw collision layer on top if viewing layer 1 or always show both
  if (layer === '1' || layer === '0') {
    const colData = m.data['1'];
    if (colData && layer === '1') {
      // Dim the base layer
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, w, h);
    }
    if (colData) {
      for (let r = 0; r < m.height && r < colData.length; r++) {
        for (let c = 0; c < m.width && c < colData[r].length; c++) {
          const tileId = colData[r][c];
          if (tileId === 0 && layer === '1') continue; // skip empty on collision layer view
          if (layer === '0') continue; // don't draw collision on base view
          const tile = getTileById(tileId);
          if (tile) {
            const img = images[tile.spriteKey];
            if (img) {
              const srcSize = gridSize;
              ctx.drawImage(img, tile.col * srcSize, tile.row * srcSize, srcSize, srcSize,
                c * MAP_TILE_PX, r * MAP_TILE_PX, MAP_TILE_PX, MAP_TILE_PX);
            }
          }
        }
      }
    }
  }

  drawMapOverlay();
}

function drawMapOverlay() {
  if (!selectedMap || !selectedMap.data) return;
  const m = selectedMap;
  const w = m.width * MAP_TILE_PX;
  const h = m.height * MAP_TILE_PX;
  const ctx = document.getElementById('mapOverlayCanvas').getContext('2d');
  ctx.clearRect(0, 0, w, h);

  if (document.getElementById('mapShowGrid').checked) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += MAP_TILE_PX) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += MAP_TILE_PX) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }
  drawEnemySpawnsOnOverlay();
}

// ========== STATIC ENEMY SPAWNS ==========
let placingEnemy = false;
let placingEnemyId = -1;
let enemyPickerCb = null;

function openEnemyPicker(onSelect) {
  enemyPickerCb = onSelect;
  document.getElementById('enemyPickerOverlay').style.display = 'flex';
  const search = document.getElementById('enemyPickerSearch');
  search.value = '';
  renderEnemyPickerList('');
  search.focus();
}

function closeEnemyPicker() {
  document.getElementById('enemyPickerOverlay').style.display = 'none';
  enemyPickerCb = null;
}

function renderEnemyPickerList(filter) {
  const list = document.getElementById('enemyPickerList');
  list.innerHTML = '';
  const lower = filter.toLowerCase();
  enemies.forEach(en => {
    if (lower && !en.name.toLowerCase().includes(lower) && !String(en.enemyId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'picker-row';
    const cvs = document.createElement('canvas'); cvs.width = 28; cvs.height = 28;
    const img = images[en.spriteKey];
    if (img) {
      const ss = en.spriteSize || 8;
      const ctx = cvs.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, en.col * ss, en.row * ss, ss, ss, 0, 0, 28, 28);
    }
    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = en.enemyId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = en.name;
    const hp = document.createElement('span'); hp.style.cssText = 'color:#e44;font-size:11px';
    hp.textContent = `HP:${en.health}`;
    row.append(cvs, id, name, hp);
    row.addEventListener('click', () => { if (enemyPickerCb) enemyPickerCb(en); closeEnemyPicker(); });
    list.appendChild(row);
  });
}

function startPlaceEnemy() {
  openEnemyPicker((en) => {
    placingEnemy = true;
    placingEnemyId = en.enemyId;
    document.getElementById('mapPlaceEnemyBtn').style.display = 'none';
    document.getElementById('mapCancelPlaceBtn').style.display = '';
    document.getElementById('mapEnemyPlaceInfo').textContent = `Click map to place: ${en.name} (ID ${en.enemyId})`;
    document.getElementById('mapOverlayCanvas').style.cursor = 'crosshair';
  });
}

function cancelPlaceEnemy() {
  placingEnemy = false;
  placingEnemyId = -1;
  document.getElementById('mapPlaceEnemyBtn').style.display = '';
  document.getElementById('mapCancelPlaceBtn').style.display = 'none';
  document.getElementById('mapEnemyPlaceInfo').textContent = '';
  document.getElementById('mapOverlayCanvas').style.cursor = '';
}

function placeEnemyOnMap(e) {
  if (!placingEnemy || !selectedMap) return;
  const canvas = document.getElementById('mapOverlayCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const col = Math.floor((e.clientX - rect.left) * scaleX / MAP_TILE_PX);
  const row = Math.floor((e.clientY - rect.top) * scaleY / MAP_TILE_PX);
  if (row < 0 || row >= selectedMap.height || col < 0 || col >= selectedMap.width) return;

  if (!selectedMap.staticSpawns) selectedMap.staticSpawns = [];
  const pixelX = col * selectedMap.tileSize;
  const pixelY = row * selectedMap.tileSize;
  selectedMap.staticSpawns.push({ enemyId: placingEnemyId, x: pixelX, y: pixelY });
  markDirty('maps');
  cancelPlaceEnemy();
  renderStaticSpawnList();
  drawMapOverlay();
}

function removeStaticSpawn(idx) {
  if (!selectedMap || !selectedMap.staticSpawns) return;
  selectedMap.staticSpawns.splice(idx, 1);
  markDirty('maps');
  renderStaticSpawnList();
  drawMapOverlay();
}

function renderStaticSpawnList() {
  const container = document.getElementById('staticSpawnList');
  container.innerHTML = '';
  if (!selectedMap) return;
  const spawns = selectedMap.staticSpawns || [];
  if (spawns.length === 0) {
    container.innerHTML = '<span style="color:#666;font-size:12px">No enemy spawns. Click "+ Place Enemy" to add.</span>';
    return;
  }
  spawns.forEach((ss, idx) => {
    const en = enemies.find(e => e.enemyId === ss.enemyId);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 4px;border-bottom:1px solid #222';

    const cvs = document.createElement('canvas'); cvs.width = 20; cvs.height = 20;
    if (en) {
      const img = images[en.spriteKey];
      if (img) {
        const ess = en.spriteSize || 8;
        const ctx = cvs.getContext('2d'); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, en.col * ess, en.row * ess, ess, ess, 0, 0, 20, 20);
      }
    }
    const name = document.createElement('span');
    name.style.cssText = 'flex:1;font-size:12px;color:#ccc';
    name.textContent = en ? `${en.name} (${ss.enemyId})` : `Enemy ${ss.enemyId}`;
    const pos = document.createElement('span');
    pos.style.cssText = 'font-size:11px;color:#888';
    const tileCol = Math.round(ss.x / selectedMap.tileSize);
    const tileRow = Math.round(ss.y / selectedMap.tileSize);
    pos.textContent = `[${tileCol},${tileRow}]`;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'tg-remove'; removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeStaticSpawn(idx));
    row.append(cvs, name, pos, removeBtn);
    container.appendChild(row);
  });
}

function drawEnemySpawnsOnOverlay() {
  if (!selectedMap || !selectedMap.staticSpawns || selectedMap.staticSpawns.length === 0) return;
  const canvas = document.getElementById('mapOverlayCanvas');
  const ctx = canvas.getContext('2d');
  const tileSize = selectedMap.tileSize || 32;

  selectedMap.staticSpawns.forEach(ss => {
    const en = enemies.find(e => e.enemyId === ss.enemyId);
    const px = (ss.x / tileSize) * MAP_TILE_PX;
    const py = (ss.y / tileSize) * MAP_TILE_PX;

    // Draw enemy sprite if available
    if (en) {
      const img = images[en.spriteKey];
      if (img) {
        const ess = en.spriteSize || 8;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, en.col * ess, en.row * ess, ess, ess, px, py, MAP_TILE_PX, MAP_TILE_PX);
      }
    }
    // Red diamond marker
    ctx.strokeStyle = '#f44';
    ctx.lineWidth = 1.5;
    const cx = px + MAP_TILE_PX / 2, cy = py + MAP_TILE_PX / 2, r = MAP_TILE_PX / 2 + 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
    ctx.closePath(); ctx.stroke();
  });
}

function mapCanvasClick(e) {
  if (placingEnemy) { placeEnemyOnMap(e); return; }
  if (!selectedMap || !selectedMap.data || mapBrushTileId < 0) return;
  const canvas = document.getElementById('mapOverlayCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const col = Math.floor((e.clientX - rect.left) * scaleX / MAP_TILE_PX);
  const row = Math.floor((e.clientY - rect.top) * scaleY / MAP_TILE_PX);
  paintMapCell(row, col);
}

function mapCanvasDrag(e) {
  if (!mapPainting) return;
  mapCanvasClick(e);
}

function paintMapCell(row, col) {
  if (!selectedMap || !selectedMap.data || mapBrushTileId < 0) return;
  const m = selectedMap;
  const layer = getMapLayer();
  if (row < 0 || row >= m.height || col < 0 || col >= m.width) return;
  if (!m.data[layer]) return;
  if (m.data[layer][row][col] === mapBrushTileId) return;
  m.data[layer][row][col] = mapBrushTileId;
  markDirty('maps');
  // Redraw just the affected cell
  redrawMapCell(row, col);
}

function redrawMapCell(row, col) {
  const m = selectedMap;
  const canvas = document.getElementById('mapCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const layer = getMapLayer();
  const x = col * MAP_TILE_PX, y = row * MAP_TILE_PX;

  // Clear cell
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, MAP_TILE_PX, MAP_TILE_PX);

  // Draw base tile
  const baseTileId = m.data['0'] ? m.data['0'][row][col] : 0;
  const baseTile = getTileById(baseTileId);
  if (baseTile) {
    const img = images[baseTile.spriteKey];
    if (img) {
      const srcSize = gridSize;
      ctx.drawImage(img, baseTile.col * srcSize, baseTile.row * srcSize, srcSize, srcSize, x, y, MAP_TILE_PX, MAP_TILE_PX);
    }
  }

  // If viewing collision layer, dim base and draw collision tile
  if (layer === '1') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y, MAP_TILE_PX, MAP_TILE_PX);
    const colTileId = m.data['1'] ? m.data['1'][row][col] : 0;
    if (colTileId !== 0) {
      const colTile = getTileById(colTileId);
      if (colTile) {
        const img = images[colTile.spriteKey];
        if (img) {
          const srcSize = gridSize;
          ctx.drawImage(img, colTile.col * srcSize, colTile.row * srcSize, srcSize, srcSize, x, y, MAP_TILE_PX, MAP_TILE_PX);
        }
      }
    }
  }
}

function mapCanvasHover(e) {
  if (!selectedMap || !selectedMap.data) return;
  const canvas = document.getElementById('mapOverlayCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const col = Math.floor((e.clientX - rect.left) * scaleX / MAP_TILE_PX);
  const row = Math.floor((e.clientY - rect.top) * scaleY / MAP_TILE_PX);
  const layer = getMapLayer();
  const m = selectedMap;
  if (row < 0 || row >= m.height || col < 0 || col >= m.width) return;
  const tileId = m.data[layer] ? m.data[layer][row][col] : -1;
  const tile = getTileById(tileId);
  document.getElementById('mapHoverInfo').textContent =
    `Row: ${row}, Col: ${col} | Layer ${layer} | Tile: ${tileId} (${tile ? tile.name : '?'})`;
}

// ========== TILE PICKER MODAL ==========
let pickerCallback = null;

function openTilePicker(onSelect) {
  pickerCallback = onSelect;
  const overlay = document.getElementById('tilePickerOverlay');
  overlay.style.display = 'flex';
  const search = document.getElementById('pickerSearch');
  search.value = '';
  renderPickerList('');
  search.focus();
}

function closeTilePicker() {
  document.getElementById('tilePickerOverlay').style.display = 'none';
  pickerCallback = null;
}

function renderPickerList(filter) {
  const list = document.getElementById('pickerList');
  list.innerHTML = '';
  const lower = filter.toLowerCase();
  tiles.forEach(t => {
    if (lower && !t.name.toLowerCase().includes(lower) && !String(t.tileId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'picker-row';

    const cvs = document.createElement('canvas'); cvs.width = 28; cvs.height = 28;
    drawTilePreview(cvs, t);

    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = t.tileId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = t.name;
    const flags = document.createElement('span'); flags.className = 'tile-flags';
    if (t.data && t.data.hasCollision) flags.innerHTML += '<span class="flag flag-c">C</span>';
    if (t.data && t.data.slows) flags.innerHTML += '<span class="flag flag-s">S</span>';
    if (t.data && t.data.damaging) flags.innerHTML += '<span class="flag flag-d">D</span>';

    row.append(cvs, id, name, flags);
    row.addEventListener('click', () => {
      if (pickerCallback) pickerCallback(t.tileId);
      closeTilePicker();
    });
    list.appendChild(row);
  });
}

// ========== ANIMATIONS ==========
const ANIM_SET_NAMES = ['idle_side','walk_side','attack_side','idle_front','walk_front','attack_down','idle_back','walk_back','attack_up'];

function renderAnimList(filter = '') {
  const list = document.getElementById('animListView');
  list.innerHTML = '';
  const lower = (filter || '').toLowerCase();
  animations.forEach(a => {
    const label = a.className || a.objectType + ':' + a.objectId;
    if (lower && !label.toLowerCase().includes(lower) && !String(a.objectId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedAnim && selectedAnim.objectId === a.objectId && selectedAnim.objectType === a.objectType ? ' selected' : '');
    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = a.objectId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = label;
    const type = document.createElement('span'); type.style.cssText = 'color:#888;font-size:11px'; type.textContent = a.objectType;
    row.append(id, name, type);
    row.addEventListener('click', () => selectAnim(a));
    list.appendChild(row);
  });
}

function selectAnim(a) {
  selectedAnim = a;
  document.getElementById('animListView').style.display = 'none';
  document.querySelector('#animationsTab .tile-header').style.display = 'none';
  showAnimDetail(a);
}

function deselectAnim() {
  selectedAnim = null;
  animPickingFrame = null;
  document.getElementById('animDetail').style.display = 'none';
  document.getElementById('animListView').style.display = '';
  document.querySelector('#animationsTab .tile-header').style.display = '';
  renderAnimList(document.getElementById('animSearch').value);
}

function showAnimDetail(a) {
  document.getElementById('animDetail').style.display = '';
  document.getElementById('animDetailTitle').textContent = a.className || (a.objectType + ':' + a.objectId);
  document.getElementById('animObjId').value = a.objectId;
  document.getElementById('animObjType').value = a.objectType;
  // Populate sprite key dropdown
  const sel = document.getElementById('animSpriteKey');
  sel.innerHTML = '';
  SPRITE_SHEETS.forEach(s => {
    const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
    if (s === a.spriteKey) opt.selected = true;
    sel.appendChild(opt);
  });
  renderAnimSets(a);
  updateAnimPreview(a);
}

function updateAnimPreview(a) {
  const cvs = document.getElementById('animPreview');
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  const idle = a.animations?.idle_side;
  if (!idle || !idle.frames.length) return;
  const frame = idle.frames[0];
  const img = images[a.spriteKey];
  if (!img) return;
  const ss = a.spriteKey.includes('16x16') ? 16 : 8;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, frame.col * ss, frame.row * ss, ss, ss, 0, 0, 64, 64);
}

function renderAnimSets(a) {
  const container = document.getElementById('animSetsContainer');
  container.innerHTML = '';
  if (!a.animations) a.animations = {};
  const ss = a.spriteKey.includes('16x16') ? 16 : 8;

  ANIM_SET_NAMES.forEach(animName => {
    if (!a.animations[animName]) a.animations[animName] = { frames: [], durations: [] };
    const animSet = a.animations[animName];

    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid #333;border-radius:4px;padding:6px;margin-bottom:6px;background:#1a1820';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px';
    const title = document.createElement('span');
    title.style.cssText = 'font-weight:bold;font-size:12px;color:#c8a86e';
    title.textContent = animName;
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add'; addBtn.textContent = '+ Frame';
    addBtn.style.cssText = 'font-size:9px;padding:1px 6px';
    addBtn.addEventListener('click', () => {
      animSet.frames.push({ row: 0, col: 0 });
      animSet.durations.push(8);
      markDirty('animations');
      renderAnimSets(a);
    });
    header.append(title, addBtn);
    card.appendChild(header);

    const framesRow = document.createElement('div');
    framesRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px';

    animSet.frames.forEach((frame, idx) => {
      const frameDiv = document.createElement('div');
      frameDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid #2a2a38;border-radius:3px;padding:3px;background:#12101a';

      // Sprite preview canvas - clickable to pick from sheet
      const cvs = document.createElement('canvas'); cvs.width = 32; cvs.height = 32;
      cvs.style.cssText = 'cursor:pointer;border:1px solid #444;image-rendering:pixelated';
      cvs.title = 'Click to pick from sprite sheet';
      const img = images[a.spriteKey];
      if (img) {
        const ctx = cvs.getContext('2d'); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, frame.col * ss, frame.row * ss, ss, ss, 0, 0, 32, 32);
      }
      cvs.addEventListener('click', () => {
        // Switch to the correct sprite sheet and enter pick mode
        if (a.spriteKey !== currentSheet) {
          currentSheet = a.spriteKey; sheetSelect.value = currentSheet; renderSheet();
        }
        animPickingFrame = { anim: a, animName, frameIdx: idx };
        pickMode = true;
        document.querySelectorAll('.btn-pick').forEach(b => b.classList.remove('active'));
        // Scroll to the frame location on sheet
        const px = frame.col * ss * SCALE, py = frame.row * ss * SCALE;
        const scroll = document.querySelector('.sheet-scroll');
        scroll.scrollTo({ left: px - scroll.clientWidth / 2, top: py - scroll.clientHeight / 2, behavior: 'smooth' });
      });

      // Row/Col labels
      const posLabel = document.createElement('span');
      posLabel.style.cssText = 'font-size:9px;color:#888';
      posLabel.textContent = `r${frame.row} c${frame.col}`;

      // Duration input
      const durInput = document.createElement('input');
      durInput.type = 'number'; durInput.min = '1'; durInput.value = animSet.durations[idx] || 8;
      durInput.style.cssText = 'width:30px;font-size:9px;text-align:center';
      durInput.title = 'Frame duration (ticks)';
      durInput.addEventListener('change', () => {
        animSet.durations[idx] = parseInt(durInput.value) || 8;
        markDirty('animations');
      });

      // Remove button
      const rmBtn = document.createElement('button');
      rmBtn.className = 'tg-remove'; rmBtn.textContent = '×';
      rmBtn.style.cssText = 'font-size:10px;padding:0 3px';
      rmBtn.addEventListener('click', () => {
        animSet.frames.splice(idx, 1);
        animSet.durations.splice(idx, 1);
        markDirty('animations');
        renderAnimSets(a);
      });

      frameDiv.append(cvs, posLabel, durInput, rmBtn);
      framesRow.appendChild(frameDiv);
    });

    card.appendChild(framesRow);
    container.appendChild(card);
  });
}

function applyAnimDetail() {
  if (!selectedAnim) return;
  selectedAnim.spriteKey = document.getElementById('animSpriteKey').value;
  markDirty('animations');
  updateAnimPreview(selectedAnim);
}

// ========== LOOT GROUPS ==========
function renderLgList(filter = '') {
  const list = document.getElementById('lgListView');
  list.innerHTML = '';
  const lower = (filter || '').toLowerCase();
  lootGroups.forEach(lg => {
    if (lower && !lg.lootGroupName.toLowerCase().includes(lower) && !String(lg.lootGroupId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedLootGroup && selectedLootGroup.lootGroupId === lg.lootGroupId ? ' selected' : '');
    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = lg.lootGroupId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = lg.lootGroupName;
    const count = document.createElement('span'); count.style.cssText = 'color:#888;font-size:11px';
    count.textContent = `${lg.potentialDrops.length} items`;
    row.append(id, name, count);
    row.addEventListener('click', () => selectLootGroup(lg));
    list.appendChild(row);
  });
}

function selectLootGroup(lg) {
  selectedLootGroup = lg;
  document.getElementById('lgListView').style.display = 'none';
  document.querySelector('#lootgroupsTab .tile-header').style.display = 'none';
  showLgDetail(lg);
}

function deselectLootGroup() {
  selectedLootGroup = null;
  document.getElementById('lgDetail').style.display = 'none';
  document.getElementById('lgListView').style.display = '';
  document.querySelector('#lootgroupsTab .tile-header').style.display = '';
  renderLgList(document.getElementById('lgSearch').value);
}

function showLgDetail(lg) {
  document.getElementById('lgDetail').style.display = '';
  document.getElementById('lgDetailTitle').textContent = lg.lootGroupName;
  document.getElementById('lgDetailId').value = lg.lootGroupId;
  document.getElementById('lgDetailName').value = lg.lootGroupName;
  renderLgItems(lg);
  renderLgEnemyUsage(lg);
}

function renderLgItems(lg) {
  const container = document.getElementById('lgDetailItems');
  container.innerHTML = '';
  lg.potentialDrops.forEach((itemId, idx) => {
    const item = items.find(i => i.itemId === itemId);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 4px;border-bottom:1px solid #222';
    const cvs = document.createElement('canvas'); cvs.width = 24; cvs.height = 24;
    if (item) {
      const img = images[item.spriteKey];
      if (img) {
        const ss = gridSize;
        const ctx = cvs.getContext('2d'); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, (item.col || 0) * ss, (item.row || 0) * ss, ss, ss, 0, 0, 24, 24);
      }
    }
    const idSpan = document.createElement('span'); idSpan.className = 'tile-id'; idSpan.textContent = itemId;
    const nameSpan = document.createElement('span'); nameSpan.style.cssText = 'flex:1;font-size:12px;color:#ccc';
    nameSpan.textContent = item ? item.name : '(unknown)';
    const tierSpan = document.createElement('span'); tierSpan.style.cssText = 'font-size:10px;color:#888';
    tierSpan.textContent = item ? `T${item.tier}` : '';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'tg-remove'; removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      lg.potentialDrops.splice(idx, 1);
      markDirty('lootGroups');
      renderLgItems(lg);
    });
    row.append(cvs, idSpan, nameSpan, tierSpan, removeBtn);
    container.appendChild(row);
  });
}

function renderLgEnemyUsage(lg) {
  const container = document.getElementById('lgEnemyUsage');
  container.innerHTML = '';
  const groupKey = `group:${lg.lootGroupId}`;
  for (const lt of lootTables) {
    if (lt.drops && lt.drops[groupKey] !== undefined) {
      const en = enemies.find(e => e.enemyId === lt.enemyId);
      const div = document.createElement('div');
      div.style.cssText = 'padding:2px 0';
      div.textContent = `Enemy ${lt.enemyId} (${en ? en.name : '?'}) — ${(lt.drops[groupKey] * 100).toFixed(0)}% chance`;
      container.appendChild(div);
    }
  }
  if (!container.children.length) {
    container.innerHTML = '<span style="color:#555">Not used by any enemy</span>';
  }
}

function applyLgDetail() {
  if (!selectedLootGroup) return;
  selectedLootGroup.lootGroupName = document.getElementById('lgDetailName').value;
  markDirty('lootGroups');
  document.getElementById('lgDetailTitle').textContent = selectedLootGroup.lootGroupName;
}

function addLootGroup() {
  const maxId = lootGroups.reduce((m, g) => Math.max(m, g.lootGroupId), -1);
  const lg = { lootGroupId: maxId + 1, lootGroupName: 'New Loot Group', potentialDrops: [] };
  lootGroups.push(lg);
  markDirty('lootGroups');
  renderLgList();
  selectLootGroup(lg);
}

function deleteLootGroup() {
  if (!selectedLootGroup) return;
  if (!confirm(`Delete loot group "${selectedLootGroup.lootGroupName}"?`)) return;
  lootGroups = lootGroups.filter(g => g.lootGroupId !== selectedLootGroup.lootGroupId);
  markDirty('lootGroups');
  deselectLootGroup();
}

function addItemToLootGroup() {
  if (!selectedLootGroup) return;
  showPickerDialog('Select Item to Add', itemOptions, (itemId) => {
    selectedLootGroup.potentialDrops.push(itemId);
    markDirty('lootGroups');
    renderLgItems(selectedLootGroup);
  });
}

// ========== ENEMY LOOT TABLE INLINE EDITOR ==========
function getLootTableForEnemy(enemyId) {
  return lootTables.find(lt => lt.enemyId === enemyId);
}

function renderEnemyLootSection(enemy) {
  const container = document.getElementById('enemyLootSection');
  if (!container) return;
  container.innerHTML = '';

  let lt = getLootTableForEnemy(enemy.enemyId);
  if (!lt) {
    const btn = document.createElement('button');
    btn.className = 'btn-add'; btn.textContent = '+ Create Loot Table';
    btn.addEventListener('click', () => {
      lootTables.push({ enemyId: enemy.enemyId, drops: { 'group:0': 1.0 }, portalDrops: {} });
      markDirty('lootTables');
      renderEnemyLootSection(enemy);
    });
    container.appendChild(btn);
    return;
  }

  // Drops section
  const dropsH = document.createElement('h4'); dropsH.textContent = 'Drops'; dropsH.style.margin = '4px 0';
  container.appendChild(dropsH);

  const dropsList = document.createElement('div');
  dropsList.style.cssText = 'max-height:150px;overflow-y:auto';
  Object.entries(lt.drops).forEach(([key, prob]) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;padding:2px 0;border-bottom:1px solid #222;font-size:12px';
    const isGroup = key.startsWith('group:');
    const refId = parseInt(key.split(':')[1]);
    const label = document.createElement('span'); label.style.cssText = 'flex:1;color:#ccc';
    if (isGroup) {
      const lg = lootGroups.find(g => g.lootGroupId === refId);
      label.textContent = `${key} (${lg ? lg.lootGroupName : '?'})`;
      label.style.color = '#c8a86e';
    } else {
      const item = items.find(i => i.itemId === refId);
      label.textContent = `${key} (${item ? item.name : '?'})`;
    }
    const probInput = document.createElement('input');
    probInput.type = 'number'; probInput.step = '0.01'; probInput.min = '0'; probInput.max = '1';
    probInput.value = prob; probInput.style.cssText = 'width:55px;font-size:11px';
    probInput.addEventListener('change', () => {
      lt.drops[key] = parseFloat(probInput.value) || 0;
      markDirty('lootTables');
    });
    const removeBtn = document.createElement('button');
    removeBtn.className = 'tg-remove'; removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      delete lt.drops[key];
      markDirty('lootTables');
      renderEnemyLootSection(enemy);
    });
    row.append(label, probInput, removeBtn);
    dropsList.appendChild(row);
  });
  container.appendChild(dropsList);

  // Add drop buttons
  const addRow = document.createElement('div');
  addRow.style.cssText = 'display:flex;gap:4px;margin-top:4px';
  const addGroupBtn = document.createElement('button');
  addGroupBtn.className = 'btn-add'; addGroupBtn.textContent = '+ Group';
  addGroupBtn.style.cssText = 'font-size:10px;padding:2px 6px';
  addGroupBtn.addEventListener('click', () => {
    showPickerDialog('Select Loot Group', lootGroupOptions, (gid) => {
      lt.drops[`group:${gid}`] = 0.1;
      markDirty('lootTables');
      renderEnemyLootSection(enemy);
    });
  });
  const addItemBtn = document.createElement('button');
  addItemBtn.className = 'btn-add'; addItemBtn.textContent = '+ Item';
  addItemBtn.style.cssText = 'font-size:10px;padding:2px 6px';
  addItemBtn.addEventListener('click', () => {
    showPickerDialog('Select Item', itemOptions, (iid) => {
      lt.drops[`item:${iid}`] = 0.05;
      markDirty('lootTables');
      renderEnemyLootSection(enemy);
    });
  });
  addRow.append(addGroupBtn, addItemBtn);
  container.appendChild(addRow);

  // Portal drops
  if (lt.portalDrops && Object.keys(lt.portalDrops).length > 0) {
    const portalH = document.createElement('h4'); portalH.textContent = 'Portal Drops'; portalH.style.margin = '8px 0 4px';
    container.appendChild(portalH);
    Object.entries(lt.portalDrops).forEach(([portalId, prob]) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:4px;padding:2px 0;font-size:12px';
      const label = document.createElement('span'); label.style.cssText = 'flex:1;color:#8080e0';
      label.textContent = `Portal ${portalId}`;
      const probInput = document.createElement('input');
      probInput.type = 'number'; probInput.step = '0.01'; probInput.min = '0'; probInput.max = '1';
      probInput.value = prob; probInput.style.cssText = 'width:55px;font-size:11px';
      probInput.addEventListener('change', () => {
        lt.portalDrops[portalId] = parseFloat(probInput.value) || 0;
        markDirty('lootTables');
      });
      row.append(label, probInput);
      container.appendChild(row);
    });
  }
}

// ========== TABS ==========
// ========== PORTALS EDITOR ==========
async function loadPortals() {
  portals = await (await fetch(`${BASE}/portals.json`)).json();
  portals.sort((a, b) => a.portalId - b.portalId);
  document.getElementById('portalCount').textContent = portals.length;
}

function portalOptions() { return portals.map(p => ({id: p.portalId, label: `[${p.portalId}] ${p.portalName}`})); }
function mapOptions() { return maps.map(m => ({id: m.mapId, label: `[${m.mapId}] ${m.mapName}`})); }

function renderPortalList(filter) {
  const list = document.getElementById('portalListView');
  list.innerHTML = '';
  const lower = (filter || '').toLowerCase();
  portals.forEach(p => {
    if (lower && !p.portalName.toLowerCase().includes(lower) && !String(p.portalId).includes(lower)) return;
    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedPortal && selectedPortal.portalId === p.portalId ? ' selected' : '');
    const cvs = document.createElement('canvas'); cvs.width = 28; cvs.height = 28;
    drawSpritePreview(cvs, p.spriteKey, p.row || 0, p.col || 0);
    const id = document.createElement('span'); id.className = 'tile-id'; id.textContent = p.portalId;
    const name = document.createElement('span'); name.className = 'tile-name'; name.textContent = p.portalName;
    const mapName = maps.find(m => m.mapId === p.mapId);
    const target = document.createElement('span'); target.style.cssText = 'color:#8080e0;font-size:11px';
    target.textContent = mapName ? `→ ${mapName.mapName}` : `→ map:${p.mapId}`;
    row.append(cvs, id, name, target);
    row.addEventListener('click', () => selectPortal(p));
    list.appendChild(row);
  });
}

function selectPortal(p) {
  selectedPortal = p;
  document.getElementById('portalListView').style.display = 'none';
  document.querySelector('#portalsTab .tile-header').style.display = 'none';
  showPortalDetail(p);
}

function deselectPortal() {
  selectedPortal = null;
  document.getElementById('portalDetail').style.display = 'none';
  document.getElementById('portalListView').style.display = '';
  document.querySelector('#portalsTab .tile-header').style.display = '';
  renderPortalList(document.getElementById('portalSearch').value);
}

function showPortalDetail(p) {
  document.getElementById('portalDetail').style.display = '';
  document.getElementById('portalTitle').textContent = `Portal ${p.portalId}: ${p.portalName}`;
  document.getElementById('portalIdField').value = p.portalId;
  document.getElementById('portalNameField').value = p.portalName || '';
  document.getElementById('portalMapId').value = p.mapId != null ? p.mapId : 0;
  document.getElementById('portalDepth').value = p.targetRealmDepth != null ? p.targetRealmDepth : -1;
  document.getElementById('portalTargetNodeId').value = p.targetNodeId || '';
  document.getElementById('portalSprite').value = p.spriteKey || '';
  document.getElementById('portalRow').value = p.row || 0;
  document.getElementById('portalCol').value = p.col || 0;
  updatePortalPreview();
  // Enhance target map with dropdown
  enhanceWithDropdown('portalMapId', mapOptions);
}

function updatePortalPreview() {
  const cvs = document.getElementById('portalPreviewCanvas');
  const spriteKey = document.getElementById('portalSprite').value;
  const row = parseInt(document.getElementById('portalRow').value) || 0;
  const col = parseInt(document.getElementById('portalCol').value) || 0;
  drawSpritePreview(cvs, spriteKey, row, col);
}

function applyPortalDetail() {
  if (!selectedPortal) return;
  const p = portals.find(x => x.portalId === selectedPortal.portalId);
  if (!p) return;
  p.portalName = document.getElementById('portalNameField').value;
  p.mapId = parseInt(document.getElementById('portalMapId').value) || 0;
  p.targetRealmDepth = parseInt(document.getElementById('portalDepth').value) || -1;
  const nodeId = document.getElementById('portalTargetNodeId').value.trim();
  if (nodeId) p.targetNodeId = nodeId; else delete p.targetNodeId;
  p.spriteKey = document.getElementById('portalSprite').value;
  p.row = parseInt(document.getElementById('portalRow').value) || 0;
  p.col = parseInt(document.getElementById('portalCol').value) || 0;
  markDirty('portals');
  document.getElementById('portalTitle').textContent = `Portal ${p.portalId}: ${p.portalName}`;
  updatePortalPreview();
}

function addPortal() {
  const maxId = portals.reduce((max, p) => Math.max(max, p.portalId), 0);
  const newPortal = {
    portalId: maxId + 1, portalName: 'New_Portal_' + (maxId + 1),
    mapId: 0, targetRealmDepth: -1,
    row: 0, col: 0, spriteKey: 'rotmg-tiles-2.png'
  };
  portals.push(newPortal);
  portals.sort((a, b) => a.portalId - b.portalId);
  document.getElementById('portalCount').textContent = portals.length;
  markDirty('portals');
  selectPortal(newPortal);
}

function deletePortal() {
  if (!selectedPortal) return;
  if (!confirm(`Delete portal ${selectedPortal.portalId} (${selectedPortal.portalName})?`)) return;
  portals = portals.filter(p => p.portalId !== selectedPortal.portalId);
  document.getElementById('portalCount').textContent = portals.length;
  markDirty('portals');
  deselectPortal();
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('tilesTab').style.display = tab === 'tiles' ? '' : 'none';
  document.getElementById('terrainsTab').style.display = tab === 'terrains' ? '' : 'none';
  document.getElementById('mapsTab').style.display = tab === 'maps' ? '' : 'none';
  document.getElementById('itemsTab').style.display = tab === 'items' ? '' : 'none';
  document.getElementById('enemiesTab').style.display = tab === 'enemies' ? '' : 'none';
  document.getElementById('projgroupsTab').style.display = tab === 'projgroups' ? '' : 'none';
  document.getElementById('lootgroupsTab').style.display = tab === 'lootgroups' ? '' : 'none';
  document.getElementById('animationsTab').style.display = tab === 'animations' ? '' : 'none';
  document.getElementById('portalsTab').style.display = tab === 'portals' ? '' : 'none';
  if (tab === 'lootgroups') renderLgList();
  if (tab === 'animations') renderAnimList();
  if (tab === 'portals') renderPortalList();
}

// ========== SAVE ==========
function markDirty(which) {
  if (which === 'tiles') dirtyTiles = true;
  if (which === 'terrains') dirtyTerrains = true;
  if (which === 'items') dirtyItems = true;
  if (which === 'projGroups') dirtyProjGroups = true;
  if (which === 'maps') dirtyMaps = true;
  if (which === 'enemies') dirtyEnemies = true;
  if (which === 'lootGroups') dirtyLootGroups = true;
  if (which === 'lootTables') dirtyLootTables = true;
  if (which === 'animations') dirtyAnimations = true;
  if (which === 'portals') dirtyPortals = true;
  saveBtn.disabled = false;
  const parts = [];
  if (dirtyTiles) parts.push('tiles');
  if (dirtyTerrains) parts.push('terrains');
  if (dirtyItems) parts.push('items');
  if (dirtyProjGroups) parts.push('projectiles');
  if (dirtyMaps) parts.push('maps');
  if (dirtyEnemies) parts.push('enemies');
  if (dirtyLootGroups) parts.push('loot groups');
  if (dirtyLootTables) parts.push('loot tables');
  if (dirtyAnimations) parts.push('animations');
  if (dirtyPortals) parts.push('portals');
  saveStatus.textContent = `(unsaved: ${parts.join(', ')})`;
  saveStatus.style.color = '#fa0';
}

async function saveAll() {
  saveBtn.disabled = true;
  saveStatus.textContent = 'Saving...';
  saveStatus.style.color = '#ff0';
  try {
    const results = [];
    if (dirtyTiles) {
      const res = await fetch('/gamedata/tiles', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(tiles, null, 4) });
      if (!res.ok) throw new Error('tiles: ' + res.statusText);
      dirtyTiles = false;
      results.push('tiles');
    }
    if (dirtyTerrains) {
      const res = await fetch('/gamedata/terrains', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(terrains, null, '\t') });
      if (!res.ok) throw new Error('terrains: ' + res.statusText);
      dirtyTerrains = false;
      results.push('terrains');
    }
    if (dirtyItems) {
      const res = await fetch('/gamedata/items', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(items, null, '\t') });
      if (!res.ok) throw new Error('items: ' + res.statusText);
      dirtyItems = false;
      results.push('items');
    }
    if (dirtyProjGroups) {
      const res = await fetch('/gamedata/projectiles', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(projGroups, null, '\t') });
      if (!res.ok) throw new Error('projectiles: ' + res.statusText);
      dirtyProjGroups = false;
      results.push('projectiles');
    }
    if (dirtyMaps) {
      const res = await fetch('/gamedata/maps', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(maps, null, '\t') });
      if (!res.ok) throw new Error('maps: ' + res.statusText);
      dirtyMaps = false;
      results.push('maps');
    }
    if (dirtyEnemies) {
      const res = await fetch('/gamedata/enemies', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(enemies, null, '\t')
      });
      if (!res.ok) throw new Error('enemies: ' + res.statusText);
      dirtyEnemies = false;
      results.push('enemies');
    }
    if (dirtyLootGroups) {
      const res = await fetch('/gamedata/lootgroups', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(lootGroups, null, '\t')
      });
      if (!res.ok) throw new Error('loot groups: ' + res.statusText);
      dirtyLootGroups = false;
      results.push('loot groups');
    }
    if (dirtyLootTables) {
      const res = await fetch('/gamedata/loottables', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(lootTables, null, '\t')
      });
      if (!res.ok) throw new Error('loot tables: ' + res.statusText);
      dirtyLootTables = false;
      results.push('loot tables');
    }
    if (dirtyAnimations) {
      const res = await fetch('/gamedata/animations', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(animations, null, '\t')
      });
      if (!res.ok) throw new Error('animations: ' + res.statusText);
      dirtyAnimations = false;
      results.push('animations');
    }
    if (dirtyPortals) {
      const res = await fetch('/gamedata/portals', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(portals, null, '\t')
      });
      if (!res.ok) throw new Error('portals: ' + res.statusText);
      dirtyPortals = false;
      results.push('portals');
    }
    saveStatus.textContent = `Saved ${results.join(', ')}!`;
    saveStatus.style.color = '#8f8';
  } catch (e) {
    saveStatus.textContent = 'Error: ' + e.message;
    saveStatus.style.color = '#f88';
    saveBtn.disabled = false;
  }
}

// ========== EVENTS ==========
function bindEvents() {
  sheetSelect.addEventListener('change', () => { currentSheet = sheetSelect.value; renderSheet(); });
  gridSizeSelect.addEventListener('change', () => { gridSize = parseInt(gridSizeSelect.value); renderSheet(); });

  // Tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Sheet hover
  const scrollEl = document.querySelector('.sheet-scroll');
  scrollEl.addEventListener('mousemove', (e) => {
    const rect = sheetCanvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (gridSize * SCALE));
    const row = Math.floor((e.clientY - rect.top) / (gridSize * SCALE));
    hoverInfo.textContent = `Row: ${row}  Col: ${col}  (px: ${col * gridSize}, ${row * gridSize})`;
  });

  // Sheet click - pick sprite (works for both tiles and items)
  scrollEl.addEventListener('click', (e) => {
    if (!pickMode) return;
    const rect = sheetCanvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (gridSize * SCALE));
    const row = Math.floor((e.clientY - rect.top) / (gridSize * SCALE));

    if (activeTab === 'tiles' && selectedTile) {
      document.getElementById('detailRow').value = row;
      document.getElementById('detailCol').value = col;
      document.getElementById('detailSprite').value = currentSheet;
      updatePreview();
      applyDetail();
      pickBtn.classList.remove('active');
      pickBtn.textContent = 'Pick from Sheet';
    } else if (activeTab === 'items' && selectedItem) {
      document.getElementById('itemRow').value = row;
      document.getElementById('itemCol').value = col;
      document.getElementById('itemSprite').value = currentSheet;
      applyItemDetail();
      document.getElementById('pickItemSpriteBtn').classList.remove('active');
      document.getElementById('pickItemSpriteBtn').textContent = 'Pick Sprite';
    } else if (activeTab === 'enemies' && selectedEnemy) {
      document.getElementById('enemyRow').value = row;
      document.getElementById('enemyCol').value = col;
      document.getElementById('enemySprite').value = currentSheet;
      updateEnemyPreview();
      applyEnemyDetail();
      const btn = document.getElementById('pickEnemySpriteBtn');
      btn.classList.remove('active');
      btn.textContent = 'Pick Sprite';
    } else if (activeTab === 'projgroups' && selectedPgTab) {
      document.getElementById('pgDetailRow').value = row;
      document.getElementById('pgDetailCol').value = col;
      document.getElementById('pgDetailSprite').value = currentSheet;
      updatePgTabPreview();
      applyPgTabDetail();
      const btn = document.getElementById('pickPgSpriteBtn');
      btn.classList.remove('active');
      btn.textContent = 'Pick Sprite';
    } else if (activeTab === 'animations' && animPickingFrame) {
      const { anim, animName, frameIdx } = animPickingFrame;
      anim.animations[animName].frames[frameIdx] = { row, col };
      markDirty('animations');
      renderAnimSets(anim);
      updateAnimPreview(anim);
      animPickingFrame = null;
    }
    pickMode = false;
  });

  tileSearch.addEventListener('input', () => renderTileList(tileSearch.value));
  document.getElementById('terrainSearch').addEventListener('input', (e) => renderTerrainList(e.target.value));

  saveBtn.addEventListener('click', saveAll);
  addTileBtn.addEventListener('click', addTile);
  deleteTileBtn.addEventListener('click', deleteTile);
  applyBtn.addEventListener('click', applyDetail);
  goToSheetBtn.addEventListener('click', goToSheet);

  pickBtn.addEventListener('click', () => {
    pickMode = !pickMode;
    pickBtn.classList.toggle('active', pickMode);
    pickBtn.textContent = pickMode ? 'Click on Sheet...' : 'Pick from Sheet';
  });

  ['detailRow', 'detailCol', 'detailSprite'].forEach(id => {
    document.getElementById(id).addEventListener('change', updatePreview);
    document.getElementById(id).addEventListener('input', updatePreview);
  });

  document.getElementById('terrainAddTileBtn').addEventListener('click', addTileToTerrain);
  document.getElementById('terrainBackBtn').addEventListener('click', deselectTerrain);
  document.getElementById('saveTerrainBtn').addEventListener('click', () => { markDirty('terrains'); });

  // Items
  document.getElementById('itemSearch').addEventListener('input', (e) => renderItemList(e.target.value));
  document.getElementById('addItemBtn').addEventListener('click', addItem);
  document.getElementById('itemBackBtn').addEventListener('click', deselectItem);
  document.getElementById('applyItemBtn').addEventListener('click', applyItemDetail);
  document.getElementById('viewProjGroupBtn').addEventListener('click', viewProjGroup);
  document.getElementById('editProjGroupTabBtn').addEventListener('click', () => {
    const pgId = parseInt(document.getElementById('dmgProjGroup').value);
    if (pgId >= 0) navigateToProjGroup(pgId);
  });
  document.getElementById('pickItemSpriteBtn').addEventListener('click', () => {
    pickMode = !pickMode;
    const btn = document.getElementById('pickItemSpriteBtn');
    btn.classList.toggle('active', pickMode);
    btn.textContent = pickMode ? 'Click on Sheet...' : 'Pick Sprite';
  });
  document.getElementById('goToItemSheetBtn').addEventListener('click', () => {
    if (!selectedItem) return;
    if (selectedItem.spriteKey !== currentSheet) {
      currentSheet = selectedItem.spriteKey; sheetSelect.value = currentSheet; renderSheet();
    }
    const ss = gridSize;
    const px = selectedItem.col * ss * SCALE, py = selectedItem.row * ss * SCALE;
    const scroll = document.querySelector('.sheet-scroll');
    scroll.scrollTo({ left: px - scroll.clientWidth / 2, top: py - scroll.clientHeight / 2, behavior: 'smooth' });
  });

  // Projectile groups
  document.getElementById('projGroupBackBtn').addEventListener('click', closeProjGroup);
  document.getElementById('applyProjGroupBtn').addEventListener('click', applyProjGroup);
  document.getElementById('addProjBtn').addEventListener('click', addProjectile);

  // Maps
  document.getElementById('mapSearch').addEventListener('input', (e) => renderMapList(e.target.value));
  document.getElementById('addMapBtn').addEventListener('click', addMap);
  document.getElementById('mapBackBtn').addEventListener('click', deselectMap);
  document.getElementById('mapLayerSelect').addEventListener('change', renderMapCanvas);
  document.getElementById('mapShowGrid').addEventListener('change', drawMapOverlay);
  document.getElementById('mapPickTileBtn').addEventListener('click', () => {
    openTilePicker((tileId) => {
      mapBrushTileId = tileId;
      updateMapBrushInfo();
    });
  });
  document.getElementById('applyMapBtn').addEventListener('click', () => { markDirty('maps'); });
  document.getElementById('mapPlaceEnemyBtn').addEventListener('click', startPlaceEnemy);
  document.getElementById('mapCancelPlaceBtn').addEventListener('click', cancelPlaceEnemy);
  document.getElementById('applyDungeonBtn').addEventListener('click', applyDungeonParams);
  document.getElementById('dpAddFloorTileBtn').addEventListener('click', addDungeonFloorTile);

  // Map canvas paint events
  const mapOverlay = document.getElementById('mapOverlayCanvas');
  mapOverlay.addEventListener('mousedown', (e) => { mapPainting = true; mapCanvasClick(e); });
  mapOverlay.addEventListener('mousemove', (e) => { mapCanvasHover(e); mapCanvasDrag(e); });
  document.addEventListener('mouseup', () => { mapPainting = false; });
  mapOverlay.addEventListener('mouseleave', () => { mapPainting = false; });

  // Right-click to erase (set to 0)
  mapOverlay.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!selectedMap || !selectedMap.data) return;
    const rect = mapOverlay.getBoundingClientRect();
    const scaleX = mapOverlay.width / rect.width;
    const scaleY = mapOverlay.height / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / MAP_TILE_PX);
    const row = Math.floor((e.clientY - rect.top) * scaleY / MAP_TILE_PX);
    const layer = getMapLayer();
    if (row >= 0 && row < selectedMap.height && col >= 0 && col < selectedMap.width) {
      selectedMap.data[layer][row][col] = 0;
      markDirty('maps');
      redrawMapCell(row, col);
    }
  });

  // Enemies
  document.getElementById('enemySearch').addEventListener('input', (e) => renderEnemyList(e.target.value));
  document.getElementById('enemyBackBtn').addEventListener('click', deselectEnemy);
  document.getElementById('applyEnemyBtn').addEventListener('click', applyEnemyDetail);
  document.getElementById('addEnemyBtn').addEventListener('click', addEnemy);
  document.getElementById('deleteEnemyBtn').addEventListener('click', deleteEnemy);
  document.getElementById('addPhaseBtn').addEventListener('click', addPhase);
  document.getElementById('editAttackIdBtn').addEventListener('click', () => {
    const atkId = parseInt(document.getElementById('enemyAttackId').value);
    if (atkId >= 0) navigateToProjGroup(atkId);
  });
  document.getElementById('enemyAttackId').addEventListener('change', () => {
    if (!selectedEnemy) return;
    const atkId = parseInt(document.getElementById('enemyAttackId').value);
    const info = document.getElementById('attackIdInfo');
    const btn = document.getElementById('editAttackIdBtn');
    if (atkId === -1) { info.textContent = '(Server-scripted attack)'; info.style.color = '#c8a86e'; btn.style.display = 'none'; }
    else { const pg = getProjGroupById(atkId); info.textContent = pg ? '(Proj Group exists)' : '(Group not found!)'; info.style.color = pg ? '#4a4' : '#e44'; btn.style.display = 'inline-block'; }
  });
  document.getElementById('pickEnemySpriteBtn').addEventListener('click', () => {
    pickMode = !pickMode;
    const btn = document.getElementById('pickEnemySpriteBtn');
    btn.classList.toggle('active', pickMode);
    btn.textContent = pickMode ? 'Click on Sheet...' : 'Pick Sprite';
  });
  document.getElementById('goToEnemySheetBtn').addEventListener('click', () => {
    if (!selectedEnemy) return;
    const ss = parseInt(document.getElementById('enemySpriteSize').value) || 8;
    if (selectedEnemy.spriteKey !== currentSheet) {
      currentSheet = selectedEnemy.spriteKey; sheetSelect.value = currentSheet; renderSheet();
    }
    const px = selectedEnemy.col * ss * SCALE, py = selectedEnemy.row * ss * SCALE;
    const scroll = document.querySelector('.sheet-scroll');
    scroll.scrollTo({ left: px - scroll.clientWidth / 2, top: py - scroll.clientHeight / 2, behavior: 'smooth' });
  });
  ['enemyRow','enemyCol','enemySprite','enemySpriteSize'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateEnemyPreview);
    document.getElementById(id).addEventListener('input', updateEnemyPreview);
  });

  // Projectile Groups tab
  document.getElementById('pgSearch').addEventListener('input', (e) => renderPgTabList(e.target.value));
  document.getElementById('pgBackBtn').addEventListener('click', deselectPgTab);
  document.getElementById('applyPgDetailBtn').addEventListener('click', applyPgTabDetail);
  document.getElementById('addPgBtn').addEventListener('click', addPgTab);
  document.getElementById('deletePgBtn').addEventListener('click', deletePgTab);
  document.getElementById('addPgProjBtn').addEventListener('click', addPgTabProjectile);
  document.getElementById('pickPgSpriteBtn').addEventListener('click', () => {
    pickMode = !pickMode;
    const btn = document.getElementById('pickPgSpriteBtn');
    btn.classList.toggle('active', pickMode);
    btn.textContent = pickMode ? 'Click on Sheet...' : 'Pick Sprite';
  });
  document.getElementById('goToPgSheetBtn').addEventListener('click', () => {
    if (!selectedPgTab) return;
    if (selectedPgTab.spriteKey !== currentSheet) {
      currentSheet = selectedPgTab.spriteKey; sheetSelect.value = currentSheet; renderSheet();
    }
    const ss = gridSize;
    const px = (selectedPgTab.col || 0) * ss * SCALE, py = (selectedPgTab.row || 0) * ss * SCALE;
    const scroll = document.querySelector('.sheet-scroll');
    scroll.scrollTo({ left: px - scroll.clientWidth / 2, top: py - scroll.clientHeight / 2, behavior: 'smooth' });
  });
  ['pgDetailRow','pgDetailCol','pgDetailSprite'].forEach(id => {
    document.getElementById(id).addEventListener('change', updatePgTabPreview);
    document.getElementById(id).addEventListener('input', updatePgTabPreview);
  });

  // Animations tab
  document.getElementById('animSearch').addEventListener('input', (e) => renderAnimList(e.target.value));
  document.getElementById('animBackBtn').addEventListener('click', deselectAnim);
  document.getElementById('applyAnimBtn').addEventListener('click', applyAnimDetail);

  // Loot Groups tab
  document.getElementById('lgSearch').addEventListener('input', (e) => renderLgList(e.target.value));
  document.getElementById('lgBackBtn').addEventListener('click', deselectLootGroup);
  document.getElementById('applyLgBtn').addEventListener('click', applyLgDetail);
  document.getElementById('addLgBtn').addEventListener('click', addLootGroup);
  document.getElementById('deleteLgBtn').addEventListener('click', deleteLootGroup);
  document.getElementById('lgAddItemBtn').addEventListener('click', addItemToLootGroup);

  // Portals
  document.getElementById('portalSearch').addEventListener('input', (e) => renderPortalList(e.target.value));
  document.getElementById('portalBackBtn').addEventListener('click', deselectPortal);
  document.getElementById('applyPortalBtn').addEventListener('click', applyPortalDetail);
  document.getElementById('addPortalBtn').addEventListener('click', addPortal);
  document.getElementById('deletePortalBtn').addEventListener('click', deletePortal);
  document.getElementById('portalSprite').addEventListener('change', updatePortalPreview);
  document.getElementById('portalRow').addEventListener('change', updatePortalPreview);
  document.getElementById('portalCol').addEventListener('change', updatePortalPreview);

  // Tile picker modal
  document.getElementById('pickerCloseBtn').addEventListener('click', closeTilePicker);
  document.getElementById('pickerSearch').addEventListener('input', (e) => renderPickerList(e.target.value));
  document.getElementById('tilePickerOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTilePicker();
  });

  // Enemy picker modal
  document.getElementById('enemyPickerCloseBtn').addEventListener('click', closeEnemyPicker);
  document.getElementById('enemyPickerSearch').addEventListener('input', (e) => renderEnemyPickerList(e.target.value));
  document.getElementById('enemyPickerOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeEnemyPicker();
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirtyTiles || dirtyTerrains || dirtyItems || dirtyProjGroups || dirtyMaps || dirtyEnemies || dirtyLootGroups || dirtyLootTables || dirtyAnimations) { e.preventDefault(); e.returnValue = ''; }
  });

  // Resize handle drag
  const handle = document.getElementById('resizeHandle');
  let resizing = false;
  handle.addEventListener('mousedown', (e) => {
    resizing = true;
    handle.classList.add('dragging');
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    const panels = document.querySelectorAll('.tile-panel');
    const newWidth = Math.max(300, window.innerWidth - e.clientX);
    panels.forEach(p => p.style.width = newWidth + 'px');
  });
  document.addEventListener('mouseup', () => {
    if (resizing) {
      resizing = false;
      handle.classList.remove('dragging');
    }
  });
}

init();
