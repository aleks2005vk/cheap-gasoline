# ⛽ Cheap Gasoline - Gas Station Finder

A web application that helps users find the cheapest gas stations in Georgia using Overpass API, OCR technology, and modern web technologies.

![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8%2B-yellow)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🗺️ **Map Integration** - Find gas stations on interactive map
- 💰 **Price Comparison** - Compare prices across locations
- 📊 **Data Analysis** - OCR-based price extraction
- 🔍 **Location Search** - Filter by area (Tbilisi, Georgia-wide)
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast Performance** - Optimized React + Vite
- 🔄 **Real-time Updates** - Live price monitoring
- 📈 **Analytics** - Track price trends

## 🏗️ Project Structure

```
cheap_gasoline/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI application
│   ├── database.py         # Database operations
│   ├── models.py           # Pydantic models
│   ├── auth.py             # Firebase authentication
│   ├── auth_utils.py       # Authentication utilities
│   ├── ocr_utils.py        # OCR processing
│   ├── data/               # Database files
│   ├── uploads/            # File uploads
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── features/           # Feature modules
│   ├── assets/             # Static assets
│   └── main.jsx            # Entry point
├── docs/                   # Documentation
│   ├── ACTIVITY.md         # Development activity log
│   ├── BACKEND_READY.md    # Backend readiness checklist
│   ├── DEPLOY.md           # Deployment instructions
│   ├── RBAC.md             # Role-Based Access Control
│   ├── ROADMAP.md          # Project roadmap
│   └── README.md           # Documentation index
├── tools/                  # Utility scripts
│   ├── append_points.cjs   # Data append scripts
│   ├── check_prices.py     # Price checking utility
│   ├── parse_georgia.cjs   # Data parsing scripts
│   └── README.md           # Tools documentation
├── scripts/                # Data processing scripts
│   ├── parse_overpass_tbilisi.cjs
│   └── new_points_*.json   # Processed data
├── public/                 # Static files
├── data/                   # Additional data files
├── package.json            # Frontend dependencies
├── vite.config.js          # Vite configuration
└── README.md               # Main documentation
```

## � Environment Setup

### Important: API Keys and Secrets

This project uses Firebase for authentication and requires API keys. **Never commit sensitive keys to version control!**

#### Frontend Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration in `.env`:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

#### Backend Environment Variables

1. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Place your `firebase-service-account.json` in the `backend/` directory
3. Update `backend/.env` with your settings

#### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Authentication and Firestore
4. Download the service account key from Project Settings > Service Accounts
5. Place the JSON file in `backend/firebase-service-account.json`

**⚠️ Security Warning**: The `firebase-service-account.json` file contains sensitive credentials and is already added to `.gitignore`. Never commit this file!

## �🚀 Quick Start

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🛠️ Tech Stack

### Backend

- **Framework**: FastAPI
- **Database**: SQLite/PostgreSQL
- **OCR**: Python OCR libraries
- **API**: Overpass API for map data
- **Authentication**: JWT tokens

### Frontend

- **Framework**: React 19
- **Build**: Vite
- **State Management**: Redux
- **Routing**: React Router
- **Styling**: CSS Modules
- **Maps**: Leaflet/Mapbox integration

## 📊 Development Activity

```
2025 Contributions
  January      ████████████████░░░░ 80%
  December     ██████████████████░░ 95%
  November     ████████████████░░░░ 85%
  October      ████████████░░░░░░░░ 60%

Total Commits: 203 | Active Days: 61 | Avg Commits/Week: 18
```

## 📂 Data Sources

- **Overpass API** - OpenStreetMap data
- **OCR Processing** - Price extraction from images
- **Local JSON Files** - Processed gas station data

### Processed Data Files

- `overpass_georgia.json` - All Georgia stations
- `overpass_tbilisi.json` - Tbilisi specific data
- `new_points_*.json` - Additional location data

## 🔧 Environment Variables

Create `.env` file in root:

```env
VITE_API_URL=http://localhost:8001
VITE_MAP_TOKEN=your_mapbox_token
PYTHON_ENV=development
DB_URL=sqlite:///./cheap_gasoline.db
```

## 📝 Database

The application uses SQLite by default. Run migrations:

```bash
cd backend
python -c "from database import init_db; init_db()"
```

## 🔗 API Endpoints

- `GET /api/stations` - List all gas stations
- `GET /api/stations/{id}` - Get station details
- `POST /api/stations` - Add new station (admin)
- `PUT /api/stations/{id}` - Update station (admin)
- `DELETE /api/stations/{id}` - Delete station (admin)

## 📚 Useful Scripts

```bash
# Parse Overpass data
node scripts/parse_overpass_tbilisi.cjs

# Generate points JSON
node scripts/gen_append.cjs

# Rebuild database
node scripts/rebuild_points.cjs
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT

## 👤 Author

Created with ❤️ for budget-conscious drivers

---

**Last Updated:** January 2026
