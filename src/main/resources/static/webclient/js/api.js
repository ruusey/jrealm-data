// HTTP REST API client for jrealm-data (login, account, game data)

const DATA_PORT = 8085;

export class ApiClient {
    constructor() {
        this.baseUrl = '';  // Same origin by default
        this.sessionToken = null;
        this.accountGuid = null;
    }

    setDataServerUrl(host) {
        // If accessing from same origin, use relative URLs
        // Otherwise, construct the full URL
        if (host && host !== window.location.hostname) {
            this.baseUrl = `http://${host}:${DATA_PORT}`;
        } else {
            this.baseUrl = '';
        }
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

    async getAccount(accountGuid) {
        return this.request('GET', `/data/account/${accountGuid}`);
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
