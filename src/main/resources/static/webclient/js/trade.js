// Trade system and nearby players UI module
import { PacketWriters, PacketId } from './codec.js';

// Track trade-related UI state
let tradeRequestFrom = null; // Name of player who sent us a trade request

export function initTradeUI(game, network, addChatMessage, invalidateUI) {
    network.on(PacketId.REQUEST_TRADE, (data) => {
        game.handleRequestTrade(data);
        tradeRequestFrom = data.requestingPlayerName;
        showTradeRequestPopup(data.requestingPlayerName, network, game, addChatMessage);
    });

    network.on(PacketId.ACCEPT_TRADE, (data) => {
        game.handleAcceptTrade(data);
        tradeRequestFrom = null;
        hideTradeRequestPopup();
        invalidateUI();
        if (data.accepted) {
            addChatMessage('SYSTEM', `Trade started with ${game.tradePartnerName}`);
        } else {
            addChatMessage('SYSTEM', 'Trade ended.');
        }
    });

    network.on(PacketId.UPDATE_TRADE, (data) => {
        game.handleUpdateTrade(data);
        invalidateUI();
    });

    network.on(PacketId.UPDATE_TRADE_SELECTION, (data) => {
        game.handleUpdateTradeSelection(data);
        invalidateUI();
    });
}

// --- Trade Request Popup ---
function showTradeRequestPopup(fromName, network, game, addChatMessage) {
    hideTradeRequestPopup();
    const popup = document.createElement('div');
    popup.id = 'trade-request-popup';
    popup.innerHTML = `
        <div class="trade-popup-content">
            <p><strong>${escHtml(fromName)}</strong> wants to trade</p>
            <div class="trade-popup-buttons">
                <button class="trade-popup-btn accept">Accept</button>
                <button class="trade-popup-btn decline">Decline</button>
            </div>
        </div>
    `;
    // Append to HUD sidebar (below inventory/player list) instead of
    // game-screen center, so it doesn't block the character view.
    const hud = document.getElementById('hud');
    if (hud) {
        hud.appendChild(popup);
    } else {
        document.getElementById('game-screen').appendChild(popup);
    }

    popup.querySelector('.accept').onclick = () => {
        network.send(PacketWriters.command(game.playerId, 3,
            JSON.stringify({ command: 'accept', args: [] })));
        hideTradeRequestPopup();
    };
    popup.querySelector('.decline').onclick = () => {
        network.send(PacketWriters.command(game.playerId, 3,
            JSON.stringify({ command: 'decline', args: [] })));
        hideTradeRequestPopup();
    };

    // Auto-dismiss after 15 seconds (matches server TTL)
    setTimeout(() => hideTradeRequestPopup(), 15000);
}

function hideTradeRequestPopup() {
    const el = document.getElementById('trade-request-popup');
    if (el) el.remove();
    tradeRequestFrom = null;
}

// --- Nearby Players List with Tooltips and Context Menu ---
const CLASS_NAMES = ['Rogue','Archer','Wizard','Priest','Warrior','Knight','Paladin',
    'Assassin','Necromancer','Mystic','Trickster','Sorcerer','Huntress'];
let lastNearbyUpdate = 0;
let contextMenuPlayer = null;

export function updateNearbyPlayers(game, network, renderer, addChatMessage) {
    const now = Date.now();
    if (now - lastNearbyUpdate < 500) return;
    lastNearbyUpdate = now;

    const container = document.getElementById('nearby-players');
    if (!container) return;

    const nearby = game.getNearbyPlayers(16);
    if (nearby.length === 0) {
        container.innerHTML = '<span style="color:#665848;font-size:10px">No players nearby</span>';
        return;
    }

    container.innerHTML = '';
    for (const p of nearby) {
        const cls = CLASS_NAMES[p.classId || 0] || '?';
        const name = (p.name || cls).substring(0, 12);
        const entry = document.createElement('div');
        entry.className = 'nearby-player';
        entry.innerHTML = `<span class="np-icon">${cls.charAt(0)}</span> ${escHtml(name)}`;

        // Hover: show player tooltip
        entry.addEventListener('mouseenter', () => showPlayerTooltip(p, game, renderer));
        entry.addEventListener('mouseleave', hidePlayerTooltip);

        // Click: show context menu (trade/tp)
        entry.addEventListener('click', (e) => {
            e.stopPropagation();
            showPlayerContextMenu(e, p, game, network, addChatMessage);
        });

        container.appendChild(entry);
    }
}

// --- Player Tooltip (on hover) ---
function showPlayerTooltip(player, game, renderer) {
    hidePlayerTooltip();
    const tip = document.createElement('div');
    tip.id = 'player-tooltip';

    const cls = CLASS_NAMES[player.classId || 0] || 'Unknown';
    const hp = player.health || '?';
    const maxHp = player.maxHealth || '?';
    const mp = player.stats?.mp || '?';

    let equipHtml = '';
    // If this player has equipment data from UpdatePacket, show it
    // (other players' inventory isn't sent — we only have what we can see)

    tip.innerHTML = `
        <div class="tooltip-name">${escHtml(player.name || cls)}</div>
        <div class="tooltip-class">${cls}</div>
        <div class="tooltip-stat tooltip-hp">HP: ${hp}/${maxHp}</div>
        <div class="tooltip-stat tooltip-mp">MP: ${mp}</div>
        ${equipHtml}
    `;
    document.getElementById('hud').appendChild(tip);
}

function hidePlayerTooltip() {
    const el = document.getElementById('player-tooltip');
    if (el) el.remove();
}

// --- Context Menu (on click) ---
function showPlayerContextMenu(event, player, game, network, addChatMessage) {
    hideContextMenu();
    const menu = document.createElement('div');
    menu.id = 'player-context-menu';

    const name = player.name || 'Player';
    menu.innerHTML = `
        <div class="ctx-header">${escHtml(name)}</div>
        <div class="ctx-option" data-action="trade">Trade</div>
        <div class="ctx-option" data-action="tp">Teleport</div>
    `;

    // Position near the click
    const hud = document.getElementById('hud');
    const hudRect = hud.getBoundingClientRect();
    menu.style.top = `${event.clientY - hudRect.top}px`;
    menu.style.right = '0px';
    hud.appendChild(menu);

    menu.querySelector('[data-action="trade"]').onclick = () => {
        network.send(PacketWriters.command(game.playerId, 3,
            JSON.stringify({ command: 'trade', args: [name] })));
        addChatMessage('SYSTEM', `Trade request sent to ${name}`);
        hideContextMenu();
    };

    menu.querySelector('[data-action="tp"]').onclick = () => {
        network.send(PacketWriters.command(game.playerId, 3,
            JSON.stringify({ command: 'tp', args: [name] })));
        addChatMessage('SYSTEM', `Teleporting to ${name}`);
        hideContextMenu();
    };

    // Close on click elsewhere
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
    }, 10);
}

function hideContextMenu() {
    const el = document.getElementById('player-context-menu');
    if (el) el.remove();
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}
