const BASE = '/game-data';
const SCALE = 4;

const SPRITE_SHEETS = [
  'rotmg-tiles-all.png','rotmg-misc.png','lofi_environment.png','lofi_obj.png',
  'lofi_char.png','lofi_dungeon_features.png','lofi_halls.png','rotmg-items.png','rotmg-items-1.png',
  'rotmg-projectiles.png','rotmg-abilities.png',
];

let tiles = [];
let terrains = [];
let items = [];
let projGroups = [];
let images = {};
let selectedTile = null;
let selectedTerrain = null;
let selectedItem = null;
let selectedProjGroup = null;
let pickMode = false;
let dirtyTiles = false;
let dirtyTerrains = false;
let dirtyItems = false;
let dirtyProjGroups = false;
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
  await Promise.all([loadTiles(), loadTerrains(), loadItems(), loadProjGroups(), loadImages()]);
  renderSheet();
  renderTileList();
  renderTerrainList();
  renderItemList();
  bindEvents();
}

function populateSheetSelect() {
  SPRITE_SHEETS.forEach(name => {
    sheetSelect.appendChild(new Option(name, name));
    ['detailSprite', 'itemSprite', 'pgSprite'].forEach(id => {
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
  9:'TELEPORT', 10:'PLAYER_PROJ', 11:'DAZED', 12:'PARAMETRIC', 13:'INV_PARAMETRIC', 14:'DAMAGING'
};

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

function renderProjList(group) {
  const container = document.getElementById('pgProjectiles');
  container.innerHTML = '';
  if (!group.projectiles) return;

  group.projectiles.forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = 'proj-row';

    const makeField = (label, key, val, width) => {
      const lbl = document.createElement('label');
      lbl.textContent = label;
      const inp = document.createElement('input');
      inp.type = key === 'angle' ? 'text' : 'number';
      inp.value = val != null ? val : '';
      inp.style.width = (width || 55) + 'px';
      inp.addEventListener('change', () => {
        if (key === 'angle') {
          p[key] = inp.value;
        } else if (key === 'flags') {
          p[key] = inp.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        } else {
          p[key] = parseFloat(inp.value) || 0;
        }
        markDirty('projGroups');
      });
      lbl.appendChild(inp);
      return lbl;
    };

    const modeSelect = document.createElement('select');
    modeSelect.style.width = '60px';
    modeSelect.style.fontSize = '11px';
    [0, 2].forEach(m => {
      const opt = new Option(POS_MODES[m] || m, m);
      opt.selected = p.positionMode === m;
      modeSelect.appendChild(opt);
    });
    modeSelect.addEventListener('change', () => { p.positionMode = parseInt(modeSelect.value); markDirty('projGroups'); });

    const modeLbl = document.createElement('label');
    modeLbl.textContent = 'Mode:';
    modeLbl.appendChild(modeSelect);

    const flagsStr = (p.flags || []).join(',');

    const removeBtn = document.createElement('button');
    removeBtn.className = 'tg-remove'; removeBtn.textContent = '\u00d7';
    removeBtn.addEventListener('click', () => {
      group.projectiles.splice(idx, 1);
      markDirty('projGroups');
      renderProjList(group);
    });

    row.append(
      modeLbl,
      makeField('Ang:', 'angle', p.angle, 65),
      makeField('Dmg:', 'damage', p.damage, 40),
      makeField('Rng:', 'range', p.range, 40),
      makeField('Spd:', 'magnitude', p.magnitude, 40),
      makeField('Sz:', 'size', p.size, 35),
      makeField('Amp:', 'amplitude', p.amplitude, 40),
      makeField('Frq:', 'frequency', p.frequency, 40),
      makeField('Flags:', 'flags', flagsStr, 70),
      removeBtn
    );
    container.appendChild(row);
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

// ========== TABS ==========
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('tilesTab').style.display = tab === 'tiles' ? '' : 'none';
  document.getElementById('terrainsTab').style.display = tab === 'terrains' ? '' : 'none';
  document.getElementById('itemsTab').style.display = tab === 'items' ? '' : 'none';
}

// ========== SAVE ==========
function markDirty(which) {
  if (which === 'tiles') dirtyTiles = true;
  if (which === 'terrains') dirtyTerrains = true;
  if (which === 'items') dirtyItems = true;
  if (which === 'projGroups') dirtyProjGroups = true;
  saveBtn.disabled = false;
  const parts = [];
  if (dirtyTiles) parts.push('tiles');
  if (dirtyTerrains) parts.push('terrains');
  if (dirtyItems) parts.push('items');
  if (dirtyProjGroups) parts.push('projectiles');
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
      const res = await fetch('/gamedata/tiles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tiles, null, 4) });
      if (!res.ok) throw new Error('tiles: ' + res.statusText);
      dirtyTiles = false;
      results.push('tiles');
    }
    if (dirtyTerrains) {
      const res = await fetch('/gamedata/terrains', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(terrains, null, '\t') });
      if (!res.ok) throw new Error('terrains: ' + res.statusText);
      dirtyTerrains = false;
      results.push('terrains');
    }
    if (dirtyItems) {
      const res = await fetch('/gamedata/items', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items, null, '\t') });
      if (!res.ok) throw new Error('items: ' + res.statusText);
      dirtyItems = false;
      results.push('items');
    }
    if (dirtyProjGroups) {
      const res = await fetch('/gamedata/projectiles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projGroups, null, '\t') });
      if (!res.ok) throw new Error('projectiles: ' + res.statusText);
      dirtyProjGroups = false;
      results.push('projectiles');
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
  document.getElementById('itemBackBtn').addEventListener('click', deselectItem);
  document.getElementById('applyItemBtn').addEventListener('click', applyItemDetail);
  document.getElementById('viewProjGroupBtn').addEventListener('click', viewProjGroup);
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

  // Tile picker modal
  document.getElementById('pickerCloseBtn').addEventListener('click', closeTilePicker);
  document.getElementById('pickerSearch').addEventListener('input', (e) => renderPickerList(e.target.value));
  document.getElementById('tilePickerOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTilePicker();
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirtyTiles || dirtyTerrains || dirtyItems || dirtyProjGroups) { e.preventDefault(); e.returnValue = ''; }
  });
}

init();
