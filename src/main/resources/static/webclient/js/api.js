// HTTP REST API client for OpenRealm data service

function isLocalHost(host) {
    return !host || host === 'localhost' || host === '127.0.0.1';
}

export class ApiClient {
    constructor() {
        this.baseUrl = '';  // Same origin by default
        this.sessionToken = null;
        this.accountGuid = null;
    }

    setDataServerUrl(host) {
        // The data API is always same-origin — the page is served by the data service.
        // The host dropdown only controls the game server (WebSocket) connection.
        this.baseUrl = '';
    }

    async request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.sessionToken) {
            headers['Authorization'] = this.sessionToken;
        }
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${this.baseUrl}${path}`, opts);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}: ${text}`);
        }
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return res.json();
        }
        return res.text();
    }

    async login(email, password) {
        const data = await this.request('POST', '/admin/account/login', { email, password });
        this.sessionToken = data.token;
        this.accountGuid = data.accountGuid;
        return data;
    }

    saveSession() {
        try {
            localStorage.setItem('or_session', JSON.stringify({
                token: this.sessionToken,
                accountGuid: this.accountGuid
            }));
        } catch (e) { /* localStorage unavailable */ }
    }

    restoreSession() {
        try {
            const raw = localStorage.getItem('or_session');
            if (!raw) return false;
            const s = JSON.parse(raw);
            if (s.token && s.accountGuid) {
                this.sessionToken = s.token;
                this.accountGuid = s.accountGuid;
                return true;
            }
        } catch (e) { /* corrupt or unavailable */ }
        return false;
    }

    clearSession() {
        this.sessionToken = null;
        this.accountGuid = null;
        try { localStorage.removeItem('or_session'); } catch (e) {}
    }

    async getAccount(accountGuid) {
        return this.request('GET', `/data/account/${accountGuid}`);
    }

    async register(email, password, accountName) {
        return this.request('POST', '/admin/account/register', {
            email, password, accountName,
            accountProvisions: [],
            accountSubscriptions: []
        });
    }

    async createCharacter(accountUuid, classId) {
        return this.request('POST', `/data/account/${accountUuid}/character?classId=${classId}`);
    }

    async deleteCharacter(characterUuid) {
        return this.request('DELETE', `/data/account/character/${characterUuid}`);
    }

    async createChest(accountUuid) {
        return this.request('POST', `/data/account/${accountUuid}/chest/new`);
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('POST', '/admin/account/password', { currentPassword, newPassword });
    }

    async getGameData(fileName) {
        const res = await fetch(`${this.baseUrl}/game-data/${fileName}`);
        if (!res.ok) throw new Error(`Failed to load ${fileName}`);
        return res.json();
    }

    getSpriteUrl(fileName) {
        return `${this.baseUrl}/game-data/${fileName}`;
    }
}
