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

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

// Enforce JWT-based session verification for all API routes
app.use('/api', verifySession);

app.use('/api/activities', activitiesRouter);
app.use('/api/sessions', sessionsRouter);

// Export the app for Vercel / serverless
export default app;

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is resonating on port ${PORT}`);
    });
}
