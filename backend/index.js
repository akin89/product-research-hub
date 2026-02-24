const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS - Limit this in production!
app.use(cors({ origin: '*' }));
app.use(express.json());

// -------------------------------------------------------------
// HELPER: AMAZON PA-API 5.0 SIGNATURE (AWS4-HMAC-SHA256)
// -------------------------------------------------------------
async function fetchAmazonPAAPI(searchTerm, page = 1) {
    const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
    const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
    const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG;
    const host = process.env.AMAZON_PAAPI_HOST || 'webservices.amazon.com';
    const region = process.env.AMAZON_PAAPI_REGION || 'us-east-1';

    if (!accessKey || !secretKey || !partnerTag) {
        throw new Error("Missing Amazon PA-API secrets in .env");
    }

    const method = 'POST';
    const service = 'ProductAdvertisingAPI';
    const path = '/paapi5/searchitems';
    const target = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8); // YYYYMMDD

    const payload = {
        Keywords: searchTerm,
        ItemPage: page,
        Resources: [
            "Images.Primary.Medium",
            "ItemInfo.Title",
            "Offers.Listings.Price",
            "CustomerReviews.Count",
            "CustomerReviews.StarRating"
        ],
        PartnerTag: partnerTag,
        PartnerType: "Associates",
        Marketplace: "www.amazon.com"
    };

    const payloadStr = JSON.stringify(payload);

    // Create Canonical Request
    const canonicalUri = path;
    const canonicalQuerystring = '';
    const canonicalHeaders = `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
    const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

    const payloadHash = crypto.createHash('sha256').update(payloadStr, 'utf8').digest('hex');
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // Create String to Sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex')}`;

    // Calculate Signature
    function sign(key, msg) {
        return crypto.createHmac('sha256', key).update(msg, 'utf8').digest();
    }

    const kDate = sign(`AWS4${secretKey}`, dateStamp);
    const kRegion = sign(kDate, region);
    const kService = sign(kRegion, service);
    const kSigning = sign(kService, 'aws4_request');
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

    const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const headers = {
        'Content-Encoding': 'amz-1.0',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Amz-Date': amzDate,
        'X-Amz-Target': target,
        'Authorization': authorizationHeader
    };

    const response = await axios.post(`https://${host}${path}`, payloadStr, { headers });
    return response.data;
}


// -------------------------------------------------------------
// ENDPOINT: AMAZON (/api/search-amazon)
// -------------------------------------------------------------
app.get('/api/search-amazon', async (req, res) => {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page || '1', 10);

        if (!query) {
            return res.status(400).json({ error: "Missing query parameter 'q'" });
        }

        const data = await fetchAmazonPAAPI(query, page);

        const items = data?.SearchResult?.Items || [];
        const formatted_products = items.map(item => {
            const listings = item.Offers?.Listings || [];
            const priceObj = listings[0]?.Price || {};
            const reviews = item.CustomerReviews || {};

            return {
                asin: item.ASIN || '',
                title: item.ItemInfo?.Title?.DisplayValue || '',
                image: item.Images?.Primary?.Medium?.URL || '',
                price: priceObj.Amount || '',
                currency: priceObj.Currency || '',
                rating: reviews.StarRating?.Value || 0,
                totalReviews: reviews.Count || 0,
                detailPageURL: item.DetailPageURL || ''
            };
        });

        res.json({ products: formatted_products });
    } catch (error) {
        console.error("Amazon API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Amazon'dan veri alınamadı", details: error.message });
    }
});


// -------------------------------------------------------------
// ENDPOINT: EBAY (/api/search-ebay) via RapidAPI Real-Time eBay Data
// -------------------------------------------------------------
app.get('/api/search-ebay', async (req, res) => {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page || '1', 10);

        if (!query) {
            return res.status(400).json({ error: "Missing query parameter 'q'" });
        }

        const rapidApiKey = process.env.RAPIDAPI_EBAY_KEY;
        if (!rapidApiKey) {
            return res.status(500).json({ error: "Eksik RAPIDAPI_EBAY_KEY environment değişkeni" });
        }

        const options = {
            method: 'GET',
            url: 'https://real-time-ebay-data.p.rapidapi.com/ebay_search',
            params: { q: query, page: page.toString() },
            headers: {
                'x-rapidapi-host': 'real-time-ebay-data.p.rapidapi.com',
                'x-rapidapi-key': rapidApiKey
            }
        };

        const response = await axios.request(options);
        const itemSummaries = response.data.itemSummaries || [];

        const products = itemSummaries.map(item => {
            const shippingCost = item.shippingOptions?.[0]?.shippingCost;
            let shippingText = 'Not specified';
            if (shippingCost?.value === '0.00' || shippingCost?.value === '0.0') {
                shippingText = 'Free Shipping';
            } else if (shippingCost?.value) {
                shippingText = `${shippingCost.value} ${shippingCost.currency}`;
            }

            return {
                title: item.title || '',
                price: item.price ? `${item.price.value} ${item.price.currency}` : '',
                shipping: shippingText,
                image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
                url: item.itemWebUrl || '',
                condition: item.condition || '',
                location: item.itemLocation ? `${item.itemLocation.country} ${item.itemLocation.postalCode || ''}`.trim() : ''
            };
        });

        res.json({ products, url: response.data.href });
    } catch (error) {
        console.error("eBay API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "eBay'den veri alınamadı", details: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
