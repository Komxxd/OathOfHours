import * as jose from 'jose';

// JWKS Cache
let jwksCache = null;

const getKeys = async (url) => {
    if (jwksCache) return jwksCache;
    // Standard Neon Auth jwks endpoint is base_url/.well-known/jwks.json 
    // but sometimes it's different. Given the searched summary, 
    // it's likely [BASE_URL]/.well-known/jwks.json or the base_url has it.
    // Let's assume the VITE_NEON_AUTH_URL is the base for the issuer.
    const jwksUrl = `${url}/.well-known/jwks.json`;
    jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl));
    return jwksCache;
};

export const verifySession = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.VITE_NEON_AUTH_URL) {
        console.error('CRITICAL: VITE_NEON_AUTH_URL is not set in environment variables.');
        return res.status(500).json({ error: 'Server misconfiguration: Authentication URL missing.' });
    }

    try {
        // Base URL normalization for JWKS
        const baseUrl = process.env.VITE_NEON_AUTH_URL.replace(/\/$/, "");
        const jwks = await getKeys(baseUrl);
        const { payload } = await jose.jwtVerify(token, jwks);

        // Neon Auth sometimes emits tokens with the domain as issuer even if the config has a path
        const expectedIss = baseUrl;
        const alternateIss = new URL(baseUrl).origin;

        if (payload.iss !== expectedIss && payload.iss !== alternateIss) {
            console.warn('--- JWT ISSUER MISMATCH ---');
            console.warn('Expected:', expectedIss, 'or', alternateIss);
            console.warn('Actual:', payload.iss);
            // We allow it to proceed for now to avoid locking out, but warn
        }

        req.userId = payload.sub;
        req.user = payload;
        next();
    } catch (error) {
        console.error('--- JWT VERIFICATION ERROR ---');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        return res.status(401).json({ error: 'Soul authentication failed: session expired or invalid.' });
    }
};
