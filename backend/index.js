import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import activitiesRouter from './routes/activities.js';
import sessionsRouter from './routes/sessions.js';
import { verifySession } from './middleware/auth.js';

dotenv.config();

const app = express();

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use('/api/', limiter);

// Debug route: will be removed once 401 is resolved
app.get('/api/debug-env', (req, res) => {
    res.json({
        hasAuthUrl: !!process.env.VITE_NEON_AUTH_URL,
        nodeEnv: process.env.NODE_ENV,
        authHeaderPresent: !!req.headers.authorization
    });
});

// Enforce JWT-based session verification for all API routes
app.use('/api', verifySession);

app.use('/api/activities', activitiesRouter);
app.use('/api/sessions', sessionsRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is resonating on port ${PORT}`);
});
