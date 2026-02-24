import React, { useState } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5001/api';

function App() {
    const [activeTab, setActiveTab] = useState('amazon');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const endpoint = activeTab === 'amazon' ? '/search-amazon' : '/search-ebay';
            const response = await fetch(`${API_BASE_URL}${endpoint}?q=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error('Bir şeyler ters gitti, lütfen tekrar dene.');
            }

            const data = await response.json();
            setResults(data.products || []);
        } catch (err) {
            console.error(err);
            setError('Bir şeyler ters gitti, lütfen tekrar dene.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>Product Research Hub</h1>
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'amazon' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('amazon'); setResults([]); setQuery(''); setError(null); }}
                    >
                        📦 Amazon Ara
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'ebay' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('ebay'); setResults([]); setQuery(''); setError(null); }}
                    >
                        🛒 eBay Ara
                    </button>
                </div>
            </header>

            <main className="main-content">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        className="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`${activeTab === 'amazon' ? 'Amazon' : 'eBay'}'da ürün ara...`}
                    />
                    <button type="submit" className="search-btn" disabled={loading}>
                        {loading ? 'Aranıyor...' : 'Ara'}
                    </button>
                </form>

                {error && <div className="error-msg">{error}</div>}

                {loading && (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="results-grid">
                        {results.map((product, idx) => (
                            <div key={idx} className="product-card">
                                <div className="product-img-wrap">
                                    <img src={product.image || 'https://via.placeholder.com/200?text=No+Image'} alt="product" />
                                </div>
                                <div className="product-info">
                                    <h3 className="product-title" title={product.title}>{product.title}</h3>
                                    <div className="product-price">
                                        {activeTab === 'amazon'
                                            ? `${product.price} ${product.currency}`
                                            : product.price}
                                    </div>

                                    {activeTab === 'amazon' && (
                                        <div className="product-meta">
                                            ⭐ {product.rating} ({product.totalReviews} yorum)
                                        </div>
                                    )}

                                    {activeTab === 'ebay' && (
                                        <div className="product-meta">
                                            <span className="condition">{product.condition}</span>
                                            <br />
                                            <span className="shipping">{product.shipping}</span>
                                        </div>
                                    )}

                                    <a
                                        href={product.detailPageURL || product.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="buy-btn"
                                    >
                                        {activeTab === 'amazon' ? "Amazon'da Aç" : "eBay'de Aç"}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && results.length === 0 && !error && query && (
                    <div className="no-results">Aradığınız kriterlerde ürün bulunamadı.</div>
                )}
            </main>
        </div>
    );
}

export default App;
