// Mobile touch controls — move joystick (left) + aim joystick (right)

let joystickActive = false;
let joystickTouchId = null;
let joystickDir = { dx: 0, dy: 0, xDir: null, yDir: null };

let aimActive = false;
let aimTouchId = null;
let aimDir = { dx: 0, dy: 0, shooting: false };

let isMobile = false;
let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;
let doubleTapCallback = null;

export function isTouchDevice() { return isMobile; }
export function getJoystickDir() { return joystickDir; }
export function getAimDir() { return aimDir; }
export function setDoubleTapHandler(fn) { doubleTapCallback = fn; }

export function initTouchControls(input) {
    isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isMobile) return;

    document.getElementById('touch-joystick').style.display = 'block';
    document.getElementById('touch-aim').style.display = 'block';
    document.getElementById('mobile-buttons').style.display = 'flex';

    // === MOVE JOYSTICK (left) ===
    const moveBase = document.getElementById('joystick-base');
    const moveThumb = document.getElementById('joystick-thumb');

    moveBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickTouchId = e.changedTouches[0].identifier;
        joystickActive = true;
        updateMoveJoystick(e.changedTouches[0], moveBase.getBoundingClientRect(), moveThumb);
    }, { passive: false });

    // === AIM JOYSTICK (right) ===
    const aimBase = document.getElementById('aim-base');
    const aimThumbEl = document.getElementById('aim-thumb');

    aimBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        aimTouchId = e.changedTouches[0].identifier;
        aimActive = true;
        updateAimJoystick(e.changedTouches[0], aimBase.getBoundingClientRect(), aimThumbEl);
    }, { passive: false });

    // === SHARED TOUCH MOVE/END ===
    document.addEventListener('touchmove', (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === joystickTouchId && joystickActive) {
                e.preventDefault();
                updateMoveJoystick(t, moveBase.getBoundingClientRect(), moveThumb);
            }
            if (t.identifier === aimTouchId && aimActive) {
                e.preventDefault();
                updateAimJoystick(t, aimBase.getBoundingClientRect(), aimThumbEl);
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === joystickTouchId) {
                joystickActive = false;
                joystickTouchId = null;
                joystickDir = { dx: 0, dy: 0, xDir: null, yDir: null };
                moveThumb.style.transform = 'translate(-50%, -50%)';
                moveThumb.style.left = '50%';
                moveThumb.style.top = '50%';
            }
            if (t.identifier === aimTouchId) {
                aimActive = false;
                aimTouchId = null;
                aimDir = { dx: 0, dy: 0, shooting: false };
                aimThumbEl.style.transform = 'translate(-50%, -50%)';
                aimThumbEl.style.left = '50%';
                aimThumbEl.style.top = '50%';
            }
        }
    });

    // Double-tap on game canvas = use ability at tap location
    const gameScreen = document.getElementById('game-canvas-container');
    gameScreen.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        // Ignore touches on joystick areas
        const isJoystick = touch.clientX < 160 && touch.clientY > window.innerHeight - 310;
        const isAim = touch.clientX > window.innerWidth - 370 && touch.clientY > window.innerHeight - 190;
        if (isJoystick || isAim) return;

        const now = Date.now();
        if (now - lastTapTime < 300) {
            // Double tap detected
            if (doubleTapCallback) {
                doubleTapCallback(touch.clientX, touch.clientY);
            }
            lastTapTime = 0; // Reset to prevent triple-tap
        } else {
            lastTapTime = now;
            lastTapX = touch.clientX;
            lastTapY = touch.clientY;
        }
    }, { passive: true });

    // Prevent ALL scrolling/bouncing on mobile
    document.addEventListener('touchmove', (e) => {
        // Allow scrolling only inside specific scrollable elements
        if (e.target.closest('#chat-messages') || e.target.closest('#char-list') ||
            e.target.closest('#nearby-players')) return;
        e.preventDefault();
    }, { passive: false });

    // Prevent pull-to-refresh and overscroll bounce
    document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

function updateMoveJoystick(touch, rect, thumb) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = touch.clientX - cx, dy = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2 - 10;
    if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }

    thumb.style.left = `${50 + (dx / rect.width) * 100}%`;
    thumb.style.top = `${50 + (dy / rect.height) * 100}%`;
    thumb.style.transform = 'translate(-50%, -50%)';

    const norm = dist / maxDist;
    if (norm < 0.25) { joystickDir = { dx: 0, dy: 0, xDir: null, yDir: null }; return; }

    const ndx = dx / maxDist, ndy = dy / maxDist;
    let xDir = null, yDir = null;
    if (ndx > 0.4) xDir = 2; else if (ndx < -0.4) xDir = 3;
    if (ndy > 0.4) yDir = 1; else if (ndy < -0.4) yDir = 0;
    joystickDir = { dx: ndx, dy: ndy, xDir, yDir };
}

function updateAimJoystick(touch, rect, thumb) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = touch.clientX - cx, dy = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2 - 8;
    if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }

    thumb.style.left = `${50 + (dx / rect.width) * 100}%`;
    thumb.style.top = `${50 + (dy / rect.height) * 100}%`;
    thumb.style.transform = 'translate(-50%, -50%)';

    const norm = dist / maxDist;
    if (norm < 0.2) { aimDir = { dx: 0, dy: 0, shooting: false }; return; }

    aimDir = { dx: dx / maxDist, dy: dy / maxDist, shooting: true };
}
