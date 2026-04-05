import os
from dotenv import load_dotenv
from uvicorn import run

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

port = int(os.environ.get("PORT", 8001))

if __name__ == "__main__":
    run("main:app", host="127.0.0.1", port=port, reload=True)
