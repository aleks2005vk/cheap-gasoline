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
│   ├── auth_utils.py       # Authentication utilities
│   ├── ocr_utils.py        # OCR processing
│   ├── requirements.txt    # Python dependencies
│   └── uploads/            # File uploads
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── features/           # Feature modules
│   ├── assets/             # Static assets
│   └── main.jsx            # Entry point
├── scripts/                # Data processing scripts
│   ├── parse_overpass_tbilisi.cjs
│   └── new_points_*.json   # Processed data
├── public/                 # Static files
├── package.json            # Frontend dependencies
├── vite.config.js          # Vite configuration
└── README.md               # Documentation
```

## 🚀 Quick Start

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
