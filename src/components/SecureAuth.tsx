// SecureAuth.tsx - More secure authentication utilities

interface AuthData {
    userId: string;
    name: string;
    timestamp: number;
    sessionId: string; // Add session tracking
}

// Security configuration
const CONFIG = {
    SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours (shorter than localStorage version)
    AUTH_KEY: 'ppa_session', // Obfuscated key name
    CHECK_INTERVAL: 5 * 60 * 1000, // Check session every 5 minutes
    USE_SESSION_STORAGE: true, // Use sessionStorage instead of localStorage
};

// Simple obfuscation (not real encryption, but better than plain text)
const obfuscate = (data: string): string => {
    return btoa(encodeURIComponent(data));
};

const deobfuscate = (data: string): string => {
    try {
        return decodeURIComponent(atob(data));
    } catch {
        return '';
    }
};

// Generate a session ID for tracking
const generateSessionId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export class SecureAuth {
    private static storage = CONFIG.USE_SESSION_STORAGE ? sessionStorage : localStorage;

    static setAuth(userId: string, name: string): void {
        const authData: AuthData = {
            userId,
            name,
            timestamp: Date.now(),
            sessionId: generateSessionId()
        };
        
        const obfuscatedData = obfuscate(JSON.stringify(authData));
        this.storage.setItem(CONFIG.AUTH_KEY, obfuscatedData);
    }

    static getAuth(): AuthData | null {
        try {
            const stored = this.storage.getItem(CONFIG.AUTH_KEY);
            if (!stored) return null;

            const deobfuscatedData = deobfuscate(stored);
            if (!deobfuscatedData) return null;

            const authData: AuthData = JSON.parse(deobfuscatedData);
            
            // Validate data structure
            if (!authData.userId || !authData.name || !authData.timestamp || !authData.sessionId) {
                this.clearAuth();
                return null;
            }

            // Check session timeout
            if (Date.now() - authData.timestamp > CONFIG.SESSION_TIMEOUT) {
                this.clearAuth();
                return null;
            }

            return authData;
        } catch (error) {
            console.error('Auth data corrupted:', error);
            this.clearAuth();
            return null;
        }
    }

    static clearAuth(): void {
        this.storage.removeItem(CONFIG.AUTH_KEY);
    }

    static isSessionValid(): boolean {
        return this.getAuth() !== null;
    }

    static updateTimestamp(): void {
        const auth = this.getAuth();
        if (auth) {
            this.setAuth(auth.userId, auth.name);
        }
    }

    static getSessionInfo(): { userId: string; name: string } | null {
        const auth = this.getAuth();
        return auth ? { userId: auth.userId, name: auth.name } : null;
    }
}

// CSRF token utilities (if you want to add CSRF protection)
export class CSRFProtection {
    private static TOKEN_KEY = 'ppa_csrf';

    static generateToken(): string {
        const token = Math.random().toString(36).substring(2) + 
                     Math.random().toString(36).substring(2);
        sessionStorage.setItem(this.TOKEN_KEY, token);
        return token;
    }

    static getToken(): string | null {
        return sessionStorage.getItem(this.TOKEN_KEY);
    }

    static validateToken(token: string): boolean {
        const storedToken = this.getToken();
        return storedToken === token;
    }

    static clearToken(): void {
        sessionStorage.removeItem(this.TOKEN_KEY);
    }
}

export default SecureAuth; 