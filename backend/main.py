import os
from datetime import timedelta
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlmodel import select
from . import database, models, ocr_utils
from sqlmodel import Session
from . import auth_utils
from fastapi.security import OAuth2PasswordBearer
from fastapi import status
from fastapi import Depends

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> models.User:
    try:
        payload = auth_utils.decode_access_token(token)
        user_id = int(payload.get('sub'))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    with database.get_session() as session:
        user = session.get(models.User, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
        return user
from pydantic import BaseModel
from fastapi.responses import FileResponse

app = FastAPI(title="Cheap Gasoline Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_ORIGINS", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.on_event("startup")
def on_startup():
    database.init_db()
    # If Tesseract is installed in common Windows location, set env var so pytesseract finds it
    default_tess = r"C:\Users\User\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
    if os.path.exists(default_tess) and not os.environ.get('TESSERACT_CMD'):
        os.environ['TESSERACT_CMD'] = default_tess


@app.get("/")
def root():
    return {"message": "Cheap Gasoline API running. See /docs for interactive API."}


@app.get("/api/stations")
def list_stations():
    with database.get_session() as session:
        stmt = select(models.Station)
        results = session.exec(stmt).all()
        return results


@app.get("/api/stations/{station_id}")
def get_station(station_id: int):
    with database.get_session() as session:
        station = session.get(models.Station, station_id)
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")
        return station


@app.post("/api/stations")
def create_station(station: models.Station):
    with database.get_session() as session:
        session.add(station)
        session.commit()
        session.refresh(station)
        return station


@app.post("/api/stations/{station_id}/prices")
def add_price(station_id: int, price_update: models.PriceUpdate, current_user: models.User = Depends(get_current_user)):
    # attach a price update to a station
    with database.get_session() as session:
        station = session.get(models.Station, station_id)
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")
        price_update.station_id = station_id
        session.add(price_update)
        session.commit()
        session.refresh(price_update)
        return price_update


# --- AUTH endpoints -------------------------------------------------


class RegisterIn(BaseModel):
    email: str
    password: str
    name: str | None = None
    avatar: str | None = None


class TokenResp(BaseModel):
    user: dict
    accessToken: str


@app.post('/api/auth/register', response_model=TokenResp)
def register(in_data: RegisterIn):
    try:
        # Validate password length (bcrypt has 72 byte limit)
        if len(in_data.password.encode('utf-8')) > 72:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Password is too long (max 72 bytes)')
        
        with database.get_session() as session:
            existing = session.exec(select(models.User).where(models.User.email == in_data.email)).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already registered')
            hashed = auth_utils.get_password_hash(in_data.password)
            user = models.User(email=in_data.email, name=in_data.name, hashed_password=hashed, avatar=in_data.avatar)
            session.add(user)
            session.commit()
            session.refresh(user)
            token = auth_utils.create_access_token({'sub': str(user.id)})
            return {'user': {'id': user.id, 'email': user.email, 'name': user.name, 'avatar': user.avatar}, 'accessToken': token}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


class LoginIn(BaseModel):
    email: str
    password: str


@app.post('/api/auth/login', response_model=TokenResp)
def login(in_data: LoginIn):
    try:
        # Validate password length (bcrypt has 72 byte limit)
        if len(in_data.password.encode('utf-8')) > 72:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Password is too long (max 72 bytes)')
        
        with database.get_session() as session:
            user = session.exec(select(models.User).where(models.User.email == in_data.email)).first()
            if not user or not user.hashed_password or not auth_utils.verify_password(in_data.password, user.hashed_password):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
            token = auth_utils.create_access_token({'sub': str(user.id)})
            return {'user': {'id': user.id, 'email': user.email, 'name': user.name, 'avatar': user.avatar}, 'accessToken': token}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))



@app.post("/api/upload-photo")
def upload_photo(file: UploadFile = File(...)):
    # Save file
    suffix = os.path.splitext(file.filename)[1]
    dest_path = os.path.join(UPLOAD_DIR, f"upload_{os.urandom(6).hex()}{suffix}")
    with open(dest_path, "wb") as f:
        f.write(file.file.read())

    # OCR
    try:
        text = ocr_utils.extract_text(dest_path)
        prices = ocr_utils.parse_prices(text)
    except Exception as e:
        # Log full traceback to console for debugging
        import traceback
        print(f"OCR error processing file {dest_path}: {e}")
        traceback.print_exc()
        # Return a concise error message to client
        raise HTTPException(status_code=500, detail=f"OCR failed: {type(e).__name__}: {str(e)}")

    return {"filename": os.path.basename(dest_path), "text": text, "prices": prices}


@app.get("/api/uploads/{filename}")
def get_upload(filename: str):
    fpath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fpath)
