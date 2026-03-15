const BASE = '/game-data';
const SCALE = 4; // render sheet at 4x for visibility since sprites are 8px

const SPRITE_SHEETS = [
  'rotmg-tiles-all.png',
  'rotmg-misc.png',
  'lofi_environment.png',
  'lofi_obj.png',
  'lofi_char.png',
  'lofi_dungeon_features.png',
  'lofi_halls.png',
  'rotmg-items.png',
  'rotmg-items-1.png',
];

let tiles = [];
let images = {};
let selectedTile = null;
let pickMode = false;
let dirty = false;
let currentSheet = SPRITE_SHEETS[0];
let gridSize = 8; // native sprite cell size on the sheet (8x8 pixels)

// DOM refs
const sheetSelect = document.getElementById('sheetSelect');
const gridSizeSelect = document.getElementById('gridSize');
const sheetCanvas = document.getElementById('sheetCanvas');
const sheetOverlay = document.getElementById('sheetOverlay');
const sheetContainer = document.getElementById('sheetContainer');
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

// Init
async function init() {
  populateSheetSelect();
  await loadTiles();
  await loadImages();
  renderSheet();
  renderTileList();
  bindEvents();
}

function populateSheetSelect() {
  SPRITE_SHEETS.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sheetSelect.appendChild(opt);
  });
  const detailSprite = document.getElementById('detailSprite');
  SPRITE_SHEETS.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    detailSprite.appendChild(opt);
  });
}

async function loadTiles() {
  const res = await fetch(`${BASE}/tiles.json`);
  tiles = await res.json();
  tiles.sort((a, b) => a.tileId - b.tileId);
  tileCount.textContent = tiles.length;
}

async function loadImages() {
  const promises = SPRITE_SHEETS.map(name => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { images[name] = img; resolve(); };
      img.onerror = () => { resolve(); };
      img.src = `${BASE}/${name}`;
    });
  });
  await Promise.all(promises);
}

// Get the native sprite cell size for extraction (row/col indexing).
// This is NOT the render size (tile.size=32). The sheets use 8x8 cells.
// The gridSize selector lets you override this for sheets with different cell sizes.
function getSpriteSize() {
  return gridSize;
}

// Sheet rendering
function renderSheet() {
  const img = images[currentSheet];
  if (!img) {
    sheetInfo.textContent = '(not loaded)';
    return;
  }

  const w = img.width * SCALE;
  const h = img.height * SCALE;
  sheetCanvas.width = w;
  sheetCanvas.height = h;
  sheetOverlay.width = w;
  sheetOverlay.height = h;

  const ctx = sheetCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);

  // Draw grid lines
  const ctx2 = sheetOverlay.getContext('2d');
  ctx2.clearRect(0, 0, w, h);
  const gs = gridSize * SCALE;
  ctx2.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx2.lineWidth = 1;
  for (let x = 0; x <= w; x += gs) {
    ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, h); ctx2.stroke();
  }
  for (let y = 0; y <= h; y += gs) {
    ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(w, y); ctx2.stroke();
  }

  highlightTilesOnSheet(ctx2);

  const cols = Math.floor(img.width / gridSize);
  const rows = Math.floor(img.height / gridSize);
  sheetInfo.textContent = `(${img.width}x${img.height}px, ${cols}x${rows} cells @ ${gridSize}px)`;
}

function highlightTilesOnSheet(ctx) {
  const ss = getSpriteSize();
  tiles.forEach(t => {
    if (t.spriteKey !== currentSheet) return;
    const px = t.col * ss * SCALE;
    const py = t.row * ss * SCALE;
    const w = ss * SCALE;

    const isSelected = selectedTile && selectedTile.tileId === t.tileId;
    if (isSelected) {
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, w - 2, w - 2);
      ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
      ctx.fillRect(px, py, w, w);
    } else {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
      ctx.fillRect(px, py, w, w);
    }
  });
}

function renderSheetOverlayOnly() {
  const img = images[currentSheet];
  if (!img) return;
  const w = img.width * SCALE;
  const h = img.height * SCALE;
  const ctx2 = sheetOverlay.getContext('2d');
  ctx2.clearRect(0, 0, w, h);

  const gs = gridSize * SCALE;
  ctx2.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx2.lineWidth = 1;
  for (let x = 0; x <= w; x += gs) {
    ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, h); ctx2.stroke();
  }
  for (let y = 0; y <= h; y += gs) {
    ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(w, y); ctx2.stroke();
  }
  highlightTilesOnSheet(ctx2);
}

// Tile list rendering
function renderTileList(filter = '') {
  tileList.innerHTML = '';
  const lower = filter.toLowerCase();
  tiles.forEach(t => {
    if (lower && !t.name.toLowerCase().includes(lower) && !String(t.tileId).includes(lower)) return;

    const row = document.createElement('div');
    row.className = 'tile-row' + (selectedTile && selectedTile.tileId === t.tileId ? ' selected' : '');
    row.dataset.tileId = t.tileId;

    // Mini preview canvas
    const cvs = document.createElement('canvas');
    cvs.width = 32;
    cvs.height = 32;
    drawTilePreview(cvs, t);

    const idSpan = document.createElement('span');
    idSpan.className = 'tile-id';
    idSpan.textContent = t.tileId;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tile-name';
    nameSpan.textContent = t.name;

    const flagsSpan = document.createElement('span');
    flagsSpan.className = 'tile-flags';
    if (t.data && t.data.hasCollision) flagsSpan.innerHTML += '<span class="flag flag-c">C</span>';
    if (t.data && t.data.slows) flagsSpan.innerHTML += '<span class="flag flag-s">S</span>';
    if (t.data && t.data.damaging) flagsSpan.innerHTML += '<span class="flag flag-d">D</span>';

    row.appendChild(cvs);
    row.appendChild(idSpan);
    row.appendChild(nameSpan);
    row.appendChild(flagsSpan);

    row.addEventListener('click', () => selectTile(t));
    tileList.appendChild(row);
  });
}

// Draw a tile preview by extracting from the sprite sheet at the native cell size
function drawTilePreview(canvas, tile) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = images[tile.spriteKey];
  if (!img) return;
  // Sprite extraction uses the native cell size (8px), not the render size (32px)
  const ss = getSpriteSize();
  const sx = tile.col * ss;
  const sy = tile.row * ss;
  ctx.drawImage(img, sx, sy, ss, ss, 0, 0, canvas.width, canvas.height);
}

function selectTile(tile) {
  selectedTile = tile;
  pickMode = false;
  pickBtn.classList.remove('active');
  pickBtn.textContent = 'Pick from Sheet';
  renderTileList(tileSearch.value);
  showDetail(tile);
  renderSheetOverlayOnly();

  // Switch sheet to match tile
  if (tile.spriteKey && tile.spriteKey !== currentSheet) {
    currentSheet = tile.spriteKey;
    sheetSelect.value = currentSheet;
    renderSheet();
  }

  // Scroll sheet to show selected tile
  const ss = getSpriteSize();
  const px = tile.col * ss * SCALE;
  const py = tile.row * ss * SCALE;
  const scroll = document.querySelector('.sheet-scroll');
  scroll.scrollTo({
    left: px - scroll.clientWidth / 2 + (ss * SCALE) / 2,
    top: py - scroll.clientHeight / 2 + (ss * SCALE) / 2,
    behavior: 'smooth'
  });
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
  const tile = tiles.find(t => t.tileId === selectedTile.tileId);
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
  markDirty();
  renderTileList(tileSearch.value);
  renderSheetOverlayOnly();
}

function addTile() {
  const maxId = tiles.reduce((max, t) => Math.max(max, t.tileId), -1);
  const newTile = {
    tileId: maxId + 1,
    name: 'New_Tile_' + (maxId + 1),
    spriteKey: currentSheet,
    row: 0,
    col: 0,
    size: 32,
    data: { hasCollision: 0, slows: 0, damaging: 0 }
  };
  tiles.push(newTile);
  tiles.sort((a, b) => a.tileId - b.tileId);
  tileCount.textContent = tiles.length;
  markDirty();
  selectTile(newTile);
}

function deleteTile() {
  if (!selectedTile) return;
  if (!confirm(`Delete tile ${selectedTile.tileId} (${selectedTile.name})?`)) return;
  tiles = tiles.filter(t => t.tileId !== selectedTile.tileId);
  tileCount.textContent = tiles.length;
  selectedTile = null;
  tileDetail.style.display = 'none';
  markDirty();
  renderTileList(tileSearch.value);
  renderSheetOverlayOnly();
}

function markDirty() {
  dirty = true;
  saveBtn.disabled = false;
  saveStatus.textContent = '(unsaved changes)';
  saveStatus.style.color = '#fa0';
}

async function saveTiles() {
  saveBtn.disabled = true;
  saveStatus.textContent = 'Saving...';
  saveStatus.style.color = '#ff0';
  try {
    const res = await fetch('/gamedata/tiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tiles, null, 4)
    });
    if (res.ok) {
      dirty = false;
      saveStatus.textContent = 'Saved!';
      saveStatus.style.color = '#8f8';
    } else {
      const err = await res.json();
      saveStatus.textContent = 'Error: ' + (err.message || res.statusText);
      saveStatus.style.color = '#f88';
      saveBtn.disabled = false;
    }
  } catch (e) {
    saveStatus.textContent = 'Error: ' + e.message;
    saveStatus.style.color = '#f88';
    saveBtn.disabled = false;
  }
}

// Event binding
function bindEvents() {
  sheetSelect.addEventListener('change', () => {
    currentSheet = sheetSelect.value;
    renderSheet();
  });

  gridSizeSelect.addEventListener('change', () => {
    gridSize = parseInt(gridSizeSelect.value);
    renderSheet();
  });

  // Sheet hover - show row/col under cursor
  const scrollEl = document.querySelector('.sheet-scroll');
  scrollEl.addEventListener('mousemove', (e) => {
    const rect = sheetCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gs = gridSize * SCALE;
    const col = Math.floor(x / gs);
    const row = Math.floor(y / gs);
    hoverInfo.textContent = `Row: ${row}  Col: ${col}  (px: ${col * gridSize}, ${row * gridSize})`;
  });

  // Sheet click - pick sprite for selected tile
  scrollEl.addEventListener('click', (e) => {
    if (!pickMode || !selectedTile) return;
    const rect = sheetCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gs = gridSize * SCALE;
    const col = Math.floor(x / gs);
    const row = Math.floor(y / gs);

    document.getElementById('detailRow').value = row;
    document.getElementById('detailCol').value = col;
    document.getElementById('detailSprite').value = currentSheet;
    updatePreview();
    applyDetail();

    pickMode = false;
    pickBtn.classList.remove('active');
    pickBtn.textContent = 'Pick from Sheet';
  });

  tileSearch.addEventListener('input', () => {
    renderTileList(tileSearch.value);
  });

  saveBtn.addEventListener('click', saveTiles);
  addTileBtn.addEventListener('click', addTile);
  deleteTileBtn.addEventListener('click', deleteTile);
  applyBtn.addEventListener('click', applyDetail);

  pickBtn.addEventListener('click', () => {
    pickMode = !pickMode;
    pickBtn.classList.toggle('active', pickMode);
    pickBtn.textContent = pickMode ? 'Click on Sheet...' : 'Pick from Sheet';
  });

  // Live preview updates when changing detail fields
  ['detailRow', 'detailCol', 'detailSprite'].forEach(id => {
    document.getElementById(id).addEventListener('change', updatePreview);
    document.getElementById(id).addEventListener('input', updatePreview);
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });
}

init();
