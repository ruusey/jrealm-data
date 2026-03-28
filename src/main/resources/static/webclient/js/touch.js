// Mobile touch controls — virtual joystick + tap-to-shoot

let joystickActive = false;
let joystickTouchId = null;
let joystickDir = { dx: 0, dy: 0, xDir: null, yDir: null };
let shootTouchId = null;
let isMobile = false;

export function isTouchDevice() {
    return isMobile;
}

export function getJoystickDir() {
    return joystickDir;
}

export function initTouchControls(input) {
    isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isMobile) return;

    const joystickEl = document.getElementById('touch-joystick');
    joystickEl.style.display = 'block';

    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    const baseRect = () => base.getBoundingClientRect();

    // Joystick touch handling
    base.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        joystickActive = true;
        updateJoystick(touch, baseRect(), thumb);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId && joystickActive) {
                e.preventDefault();
                updateJoystick(touch, baseRect(), thumb);
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                joystickActive = false;
                joystickTouchId = null;
                joystickDir = { dx: 0, dy: 0, xDir: null, yDir: null };
                thumb.style.transform = 'translate(-50%, -50%)';
                thumb.style.left = '50%';
                thumb.style.top = '50%';
            }
            if (touch.identifier === shootTouchId) {
                shootTouchId = null;
            }
        }
    });

    // Tap to shoot — any touch on the right 2/3 of screen
    const canvas = document.getElementById('game-canvas-container');
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        // Only register as shoot if touch is on right side (not on joystick)
        if (touch.clientX > window.innerWidth * 0.33) {
            shootTouchId = touch.identifier;
            input._touchShootX = touch.clientX;
            input._touchShootY = touch.clientY;
            input._touchShooting = true;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === shootTouchId) {
                input._touchShootX = touch.clientX;
                input._touchShootY = touch.clientY;
            }
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === shootTouchId) {
                input._touchShooting = false;
                shootTouchId = null;
            }
        }
    });

    // Prevent default touch behaviors on game screen
    document.getElementById('game-screen').addEventListener('touchmove', (e) => {
        if (e.target.closest('#hud') || e.target.closest('#chat-panel')) return;
        e.preventDefault();
    }, { passive: false });
}

function updateJoystick(touch, rect, thumb) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2 - 10;

    // Clamp to circle
    if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
    }

    // Move thumb
    thumb.style.left = `${50 + (dx / rect.width) * 100}%`;
    thumb.style.top = `${50 + (dy / rect.height) * 100}%`;
    thumb.style.transform = 'translate(-50%, -50%)';

    // Convert to direction — deadzone of 15%
    const norm = dist / maxDist;
    if (norm < 0.15) {
        joystickDir = { dx: 0, dy: 0, xDir: null, yDir: null };
        return;
    }

    // Map to NSEW cardinality matching the keyboard input system
    const ndx = dx / maxDist;
    const ndy = dy / maxDist;

    let xDir = null, yDir = null;
    if (ndx > 0.3) xDir = 2;       // EAST
    else if (ndx < -0.3) xDir = 3; // WEST
    if (ndy > 0.3) yDir = 1;       // SOUTH
    else if (ndy < -0.3) yDir = 0; // NORTH

    joystickDir = { dx: ndx, dy: ndy, xDir, yDir };
}
