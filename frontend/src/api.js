const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Helper to include JWT for authenticated requests
const getHeaders = (token) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
});

export const api = {
    // Activities
    getActivities: async (token) => {
        const res = await fetch(`${API_URL}/activities`, { headers: getHeaders(token) });
        return res.json();
    },

    createActivity: async (token, name) => {
        const res = await fetch(`${API_URL}/activities`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify({ name })
        });
        return res.json();
    },

    renameActivity: async (token, id, name) => {
        const res = await fetch(`${API_URL}/activities/${id}`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify({ name })
        });
        return res.json();
    },

    deleteActivity: async (token, id) => {
        const res = await fetch(`${API_URL}/activities/${id}`, {
            method: 'DELETE',
            headers: getHeaders(token)
        });
        return res.json();
    },

    // Sessions
    getActiveSession: async (token) => {
        const res = await fetch(`${API_URL}/sessions/active`, { headers: getHeaders(token) });
        return res.json();
    },

    startSession: async (token, activityId) => {
        const res = await fetch(`${API_URL}/sessions/start`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify({ activityId })
        });
        return res.json();
    },

    stopSession: async (token) => {
        const res = await fetch(`${API_URL}/sessions/stop`, {
            method: 'POST',
            headers: getHeaders(token)
        });
        return res.json();
    }
};
