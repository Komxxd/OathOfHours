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

    try {
        const jwks = await getKeys(process.env.VITE_NEON_AUTH_URL);
        const { payload } = await jose.jwtVerify(token, jwks);

        if (payload.iss !== process.env.VITE_NEON_AUTH_URL) {
            console.warn('--- JWT ISSUER MISMATCH ---');
            console.warn('Expected:', process.env.VITE_NEON_AUTH_URL);
            console.warn('Actual:', payload.iss);
        }

        req.userId = payload.sub;
        req.user = payload;
        next();
    } catch (error) {
        // Log detailed error for server console (not sent to client)
        console.error('--- JWT VERIFICATION ERROR ---');
        console.error('Message:', error.message);
        console.error('Issuer Config:', process.env.VITE_NEON_AUTH_URL);
        console.error('Code:', error.code);
        return res.status(401).json({ error: 'Soul authentication failed: session expired or invalid.' });
    }
};
