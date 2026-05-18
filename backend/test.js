const axios = require('axios');
require('dotenv').config();

async function testApi() {
    const rapidApiKey = process.env.RAPIDAPI_EBAY_KEY;

    if (!rapidApiKey) {
        throw new Error('Missing RAPIDAPI_EBAY_KEY in .env');
    }

    const options = {
        method: 'GET',
        url: 'https://real-time-ebay-data.p.rapidapi.com/search',
        params: { q: 'iphone', page: '1' },
        headers: {
            'x-rapidapi-host': 'real-time-ebay-data.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey
        }
    };

    try {
        const response = await axios.request(options);
        console.log(JSON.stringify(response.data).substring(0, 1000));
    } catch (error) {
        if (error.response) {
            console.error("HTTP Error:", error.response.status, error.response.data);
        } else {
            console.error(error.message);
        }

        // Fallback test
        const options2 = {
            method: 'GET',
            url: 'https://real-time-ebay-data.p.rapidapi.com/ebay_search',
            params: { q: 'iphone', page: '1' },
            headers: options.headers
        };
        try {
            const r2 = await axios.request(options2);
            console.log("SUCCESS on /ebay_search :", JSON.stringify(r2.data).substring(0, 1000));
        } catch (e2) {
            console.error("Fallback failing too...", e2.response?.data);
        }
    }
}

testApi();
