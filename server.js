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

// Serve static files from current directory
app.use(express.static(__dirname));

// Cache to avoid hitting API limits (500 requests/month)
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

// Serve the main HTML file at root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/odds-analyzer.html');
});

// Proxy endpoint to fetch odds with caching
app.get('/api/odds/:sport', async (req, res) => {
    const { sport } = req.params;
    
    // Check cache first
    const cacheKey = sport;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`✅ Cache hit for ${sport}`);
        return res.json(cached.data);
    }
    
    try {
        // Request only supported markets: h2h, spreads, totals
        // btts is only for soccer and not always available
        const url = `${API_BASE}/sports/${sport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,spreads,totals&oddsFormat=decimal`;
        
        console.log(`📡 Fetching from API: ${sport}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`❌ Error for ${sport}: ${response.status}`);
            return res.status(response.status).json({ error: 'API Error' });
        }
        
        const data = await response.json();
        
        // Cache the result
        cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        console.log(`✅ Cached ${sport} (${data.length} matches)`);
        
        res.json(data);
    } catch (error) {
        console.error(`❌ Error fetching ${sport}:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        cacheSize: cache.size
    });
});

// Clear old cache every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
            console.log(`🧹 Cleared cache for ${key}`);
        }
    }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📊 API Key: ${API_KEY.substring(0, 8)}...`);
    console.log(`⏱️  Cache duration: 30 minutes`);
});
