const express = require('express');
const router = express.Router();
const LogEntry = require('../models/LogEntry');

// Helper to parse JSONL
const parseJSONL = (jsonlString) => {
    return jsonlString
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        })
        .filter(entry => entry !== null);
};

// POST /logs - Ingest logs
router.post('/logs', async (req, res) => {
    try {
        let entries = [];

        // Handle JSONL content type or just text/plain if client sends that
        if (req.headers['content-type'] === 'application/x-ndjson' || typeof req.body === 'string') {
            entries = parseJSONL(req.body);
        } else if (Array.isArray(req.body)) {
            entries = req.body;
        } else if (typeof req.body === 'object') {
            entries = [req.body];
        }

        if (entries.length === 0) {
            return res.status(400).json({ message: 'No valid log entries found' });
        }

        await LogEntry.insertMany(entries);
        res.status(201).json({ message: `Saved ${entries.length} log entries` });
    } catch (err) {
        console.error('Error saving logs:', err);
        res.status(500).json({ error: 'Failed to save logs' });
    }
});

// GET /logs - Fetch logs with optional filtering
router.get('/logs', async (req, res) => {
    try {
        const { userAgent, startTime, endTime } = req.query;
        let query = {};

        if (userAgent) {
            query.userAgent = userAgent;
        }

        if (startTime || endTime) {
            query.timestamp = {};
            if (startTime) query.timestamp.$gte = new Date(startTime);
            if (endTime) query.timestamp.$lte = new Date(endTime);
        }

        // Limit to 1000 for performance, sort by newest first
        const logs = await LogEntry.find(query).sort({ timestamp: -1 }).limit(1000);
        res.json(logs);
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// GET /user-agents - Get list of unique user agents
router.get('/user-agents', async (req, res) => {
    try {
        const userAgents = await LogEntry.distinct('userAgent');
        res.json(userAgents);
    } catch (err) {
        console.error('Error fetching user agents:', err);
        res.status(500).json({ error: 'Failed to fetch user agents' });
    }
});

module.exports = router;
