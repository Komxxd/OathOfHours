import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// Get all activities for a user
router.get('/', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const activities = await prisma.activity.findMany({
            where: { userId: req.userId },
            include: {
                sessions: {
                    where: { endTime: { not: null } },
                    select: { startTime: true, endTime: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate start of week (assuming Monday start)
        const dayOfWeek = now.getDay() || 7; // Convert Sunday(0) to 7
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - dayOfWeek + 1);

        const activitiesWithStats = activities.map(act => {
            let today = 0;
            let week = 0;
            let allTime = 0;

            act.sessions.forEach(session => {
                const sStart = new Date(session.startTime);
                const sEnd = new Date(session.endTime);
                let durationSecs = Math.floor((sEnd.getTime() - sStart.getTime()) / 1000);
                if (durationSecs < 0) durationSecs = 0;

                allTime += durationSecs;

                // Today's portion: only count seconds between max(sStart, startOfToday) and sEnd
                if (sEnd > startOfToday) {
                    const effectiveStart = sStart < startOfToday ? startOfToday : sStart;
                    const todayPortion = Math.floor((sEnd.getTime() - effectiveStart.getTime()) / 1000);
                    today += (todayPortion > 0 ? todayPortion : 0);
                }

                // Week's portion: only count seconds between max(sStart, startOfWeek) and sEnd
                if (sEnd > startOfWeek) {
                    const effectiveStart = sStart < startOfWeek ? startOfWeek : sStart;
                    const weekPortion = Math.floor((sEnd.getTime() - effectiveStart.getTime()) / 1000);
                    week += (weekPortion > 0 ? weekPortion : 0);
                }
            });

            const { sessions, ...rest } = act;
            return {
                ...rest,
                stats: { today, week, allTime }
            };
        });

        res.json(activitiesWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

// Create an activity
router.post('/', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'A valid discipline name is required.' });
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
        return res.status(400).json({ error: 'Discipline name must be at least 2 characters.' });
    }

    try {
        const activity = await prisma.activity.create({
            data: {
                userId: req.userId,
                name: trimmedName
            }
        });
        res.json({
            ...activity,
            stats: { today: 0, week: 0, allTime: 0 }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
});

// Rename an activity
router.put('/:id', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim() || name.trim().length < 2) {
        return res.status(400).json({ error: 'Valid discipline name is required (min 2 characters).' });
    }

    try {
        const activity = await prisma.activity.updateMany({
            where: { id, userId: req.userId },
            data: { name: name.trim() }
        });

        if (activity.count === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // We aren't updating stats here, but we can reuse the existing stats the frontend has.
        // Returning just the updated fields is fine, but let's at least match the structure or let UI handle it.
        const updated = await prisma.activity.findUnique({ where: { id } });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update activity' });
    }
});

// Delete an activity
router.delete('/:id', async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    try {
        const activity = await prisma.activity.deleteMany({
            where: { id, userId: req.userId },
        });

        if (activity.count === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete activity' });
    }
});

export default router;
