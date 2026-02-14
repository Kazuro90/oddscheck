// server.js - Node.js Express server as proxy for The Odds API
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Your API key
const API_KEY = '7197cc03d0850149810cdc01974d2bb6';
const API_BASE = 'https://api.the-odds-api.com/v4';

// Enable CORS for all origins
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Proxy endpoint to fetch odds
app.get('/api/odds/:sport', async (req, res) => {
    const { sport } = req.params;
    
    try {
        const url = `${API_BASE}/sports/${sport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal`;
        console.log(`Fetching: ${sport}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Error for ${sport}: ${response.status}`);
            return res.status(response.status).json({ error: 'API Error' });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(`Error fetching ${sport}:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📊 API Key: ${API_KEY.substring(0, 8)}...`);
});
