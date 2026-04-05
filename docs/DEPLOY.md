# Cheap Gasoline - Full Deployment Guide

## Frontend Deployment (Vercel/Netlify)

### Vercel

```bash
npm install -g vercel
vercel login
vercel deploy
```

### Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

## Backend Deployment

### Option 1: Railway (RECOMMENDED)

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### Option 2: Render

1. Push code to GitHub
2. Go to render.com
3. Create New → Web Service
4. Connect GitHub repository
5. Set environment variables

### Option 3: Heroku

```bash
heroku login
heroku create cheap-gasoline-api
git push heroku main
```

## Environment Variables

### Frontend (.env.production)

```
VITE_API_URL=https://your-api-url.com
VITE_ENV=production
```

### Backend (.env)

```
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=https://your-frontend-url.com
ENVIRONMENT=production
```

## Full Setup Process

```bash
# 1. Frontend build
npm install
npm run build

# 2. Test build locally
npm run preview

# 3. Deploy frontend
vercel deploy --prod

# 4. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 5. Run backend
python main.py

# 6. Update API URL in frontend
# Change VITE_API_URL to your backend URL
```

## Database Setup

```bash
cd backend

# Create database
python -c "from database import init_db; init_db()"

# Import data
python import_points.py

# Run migrations (if needed)
python -m alembic upgrade head
```

## Checklist

- [ ] Frontend builds without errors
- [ ] Backend API runs
- [ ] Database connection works
- [ ] API endpoints accessible
- [ ] CORS configured properly
- [ ] Environment variables set
- [ ] .env files in .gitignore
- [ ] dist/ folder excluded from git

## Common Errors & Fixes

### "Cannot GET /api/stations"

- Check backend is running
- Verify API URL in frontend
- Check CORS configuration

### Database connection failed

- Verify DATABASE_URL
- Check database is running
- Test connection: `python -c "from database import get_db; list(get_db())"`

### Module not found

```bash
npm install
pip install -r requirements.txt
```

### Port already in use

```bash
# Change port in vite.config.js or:
PORT=3001 npm run preview
```

## Production Checklist

- [ ] API URL uses https
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] CORS headers correct
- [ ] Rate limiting enabled
- [ ] Security headers set
