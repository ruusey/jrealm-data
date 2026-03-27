// Keyboard and mouse input handling

export class InputHandler {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = [false, false, false];
        this.mouseClicked = [false, false, false];
        this.chatMode = false;

        // Movement state
        this.moveDir = -1;      // Current direction byte
        this.isMoving = false;
        this.lastDir = -1;

        // Bind events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onKeyDown(e) {
        if (this.chatMode && e.key !== 'Enter' && e.key !== 'Escape') return;
        this.keys[e.code] = true;
        // Prevent browser defaults for game keys
        if (['F1', 'F2', 'F3', 'F4', 'Escape'].includes(e.key)) e.preventDefault();
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    onMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    onMouseDown(e) {
        this.mouseDown[e.button] = true;
        this.mouseClicked[e.button] = true;
    }

    onMouseUp(e) {
        this.mouseDown[e.button] = false;
    }

    consumeClick(button) {
        const was = this.mouseClicked[button];
        this.mouseClicked[button] = false;
        return was;
    }

    isKeyDown(code) { return !!this.keys[code]; }

    // Calculate movement direction matching Java's Cardinality enum:
    // NORTH=0, SOUTH=1, EAST=2, WEST=3, NONE=4
    // Server only supports 4 cardinal directions, pick dominant axis for diagonals
    getMovementDirection() {
        if (this.chatMode) return { dir: 4, moving: false, dx: 0, dy: 0 };

        let dx = 0, dy = 0;
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp'))    dy -= 1;
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown'))  dy += 1;
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft'))  dx -= 1;
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) dx += 1;

        const moving = dx !== 0 || dy !== 0;
        let dir = 4; // NONE

        if (moving) {
            // Pick dominant axis (prefer vertical for exact diagonal)
            if (Math.abs(dy) >= Math.abs(dx)) {
                dir = dy < 0 ? 0 : 1; // NORTH or SOUTH
            } else {
                dir = dx > 0 ? 2 : 3; // EAST or WEST
            }
        }

        // Normalize diagonal movement speed
        if (dx !== 0 && dy !== 0) {
            const inv = 1.0 / Math.sqrt(2);
            dx *= inv;
            dy *= inv;
        }

        return { dir, moving, dx, dy };
    }

    wantsShoot() { return this.mouseDown[0] && !this.chatMode; }
    wantsAbility() { return this.consumeClick(2) && !this.chatMode; }
}
