# Product Research Hub 🛒

A full-stack project for researching products on **Amazon** and **eBay**. 

## Features
- **Amazon Product Search:** Uses the official Amazon Product Advertising API (PA-API 5.0) via AWS Signature V4.
- **eBay Product Search:** Uses the RapidAPI "Real-Time eBay Data" endpoint for live, accurate search results and pricing.
- **Node.js Express Backend:** Fast and minimal HTTP server.
- **React Drop-in Frontend:** Simple, clean, and responsive UI.

---

## 🚀 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/product-research-hub.git
cd product-research-hub
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Copy the `.env.example` file to create your local `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in your Amazon PA-API secrets. **DO NOT commit your `.env` file.** It is already added to `.gitignore`. API keys belong to the user, and this project does not store them anywhere except on your local machine.

Run the backend server:
```bash
npm run dev
# Server will start on http://localhost:5001
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
# By default, Vite runs on http://localhost:5173
```

---

## 🔒 Security Note
This project fetches from Amazon via a backend server precisely to **protect your AWS Credentials**. The credentials must never be included in the frontend React bundle. Always set your credentials in the backend `.env` file securely.

## 🤝 Contribution
Feel free to open a Pull Request if you'd like to improve the scrape logic, expand features, or add new marketplaces!
