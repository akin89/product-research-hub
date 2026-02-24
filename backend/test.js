const axios = require('axios');

async function testApi() {
    const options = {
        method: 'GET',
        url: 'https://real-time-ebay-data.p.rapidapi.com/search',
        params: { q: 'iphone', page: '1' },
        headers: {
            'x-rapidapi-host': 'real-time-ebay-data.p.rapidapi.com',
            'x-rapidapi-key': 'f64fbbf60cmsh75f939abe507b26p1a6ee6jsnaa33ea3b1905'
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
