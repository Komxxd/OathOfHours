import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// Get active session
router.get('/active', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const activeSession = await prisma.session.findFirst({
            where: {
                userId: req.userId,
                endTime: null
            },
            include: {
                activity: true
            }
        });

        res.json(activeSession || null);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch active session' });
    }
});

// Start a new session
router.post('/start', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { activityId } = req.body;
    if (!activityId) return res.status(400).json({ error: 'Activity ID is required' });

    try {
        // Check for any ongoing active sessions
        const activeSession = await prisma.session.findFirst({
            where: { userId: req.userId, endTime: null }
        });

        if (activeSession) {
            // AUTOMATIC HEALING: If an active session is found, auto-close it with exactly *now*
            // to fulfill "no multiple active sessions" rule robustly if states hit a weird edge-case
            await prisma.session.update({
                where: { id: activeSession.id },
                data: { endTime: new Date() }
            });
        }

        // Make sure the activity belongs to the user
        const activity = await prisma.activity.findUnique({
            where: { id: activityId }
        });

        if (!activity || activity.userId !== req.userId) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Strictly enforce that the startTime is absolute safely.
        const newSession = await prisma.session.create({
            data: {
                userId: req.userId,
                activityId,
                startTime: new Date()
            },
            include: { activity: true }
        });

        res.json(newSession);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// Stop an active session
router.post('/stop', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Find the active session robustly resolving earliest to oldest
        const activeSessions = await prisma.session.findMany({
            where: { userId: req.userId, endTime: null },
            orderBy: { startTime: 'desc' }
        });

        if (activeSessions.length === 0) {
            return res.status(400).json({ error: 'No active session found' });
        }

        // Safe resolution: in the EXTREME edge-case of multiples, we kill ALL active sessions for this user up to Now. 
        // Eliminates data corruption leaks permanently
        const stopTime = new Date();
        for (const session of activeSessions) {
            // Guarantee end_time >= start_time to prevent negative or corrupted durations!
            const safeEndTime = stopTime < new Date(session.startTime) ? new Date(session.startTime) : stopTime;
            await prisma.session.update({
                where: { id: session.id },
                data: { endTime: safeEndTime }
            });
        }

        res.json({ message: 'Session stopped safely and accurately' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to stop session' });
    }
});

export default router;
