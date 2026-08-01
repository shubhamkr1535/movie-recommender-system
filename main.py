# ═══════════════════════════════════════════════════════════════
#  MovieMatch — main.py
#  FastAPI backend with Google Drive auto-download
# ═══════════════════════════════════════════════════════════════

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pickle
import pandas as pd
from pathlib import Path

# ── STEP 1: Google Drive se similarity.pkl download karo ──────
# gdown ek library hai jo Google Drive se files download karti hai
import gdown

BASE_DIR = Path(__file__).resolve().parent
SIM_PATH = BASE_DIR / "similarity.pkl"

if not SIM_PATH.exists():
    # Jab bhi server start ho aur similarity.pkl na mile
    # ye automatically Google Drive se download kar leta hai
    print("⬇️  Downloading similarity.pkl from Google Drive...")
    gdown.download(
        # Tumhara Google Drive file ID yahan hai
        "https://drive.google.com/uc?id=19IbslM1pBPtGlgRhWpj3rQWT1LQXML3s",
        str(SIM_PATH),
        quiet=False
    )
    print("✅ Download complete!")
else:
    print("✅ similarity.pkl already exists, skipping download.")

# ── STEP 2: FastAPI app banao ─────────────────────────────────
app = FastAPI()

# CORS — browser ko allow karo ki kisi bhi domain se API call kar sake
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── STEP 3: .pkl files load karo ─────────────────────────────
def _load(p):
    """Pickle file open karke data return karo"""
    try:
        return pickle.load(open(p, "rb"))
    except Exception as e:
        print(f"⚠️  Warning: {p} load nahi hua: {e}")
        return None

# movie_list.pkl  → 4806 movies ka DataFrame (title, tags, etc.)
# similarity.pkl  → 4806x4806 cosine similarity matrix
movies     = _load(BASE_DIR / "movie_list.pkl")
similarity = _load(SIM_PATH)

# ── STEP 4: Recommendation logic ─────────────────────────────
def recommend(movie: str):
    """
    Kaise kaam karta hai:
    1. Movie ka index dhundo DataFrame mein
    2. Us index ki similarity scores nikalo matrix se
    3. Top 5 highest scores wali movies return karo
    """
    if movies is None or similarity is None:
        raise RuntimeError("Model files load nahi hue")

    # Movie ka row dhundo (exact match)
    matched = movies[movies['title'] == movie]

    # Agar exact match nahi mila to case-insensitive try karo
    if matched.empty:
        matched = movies[movies['title'].str.lower() == movie.lower()]

    if matched.empty:
        raise ValueError(f"'{movie}' database mein nahi mili")

    # Movie ka index nikalo
    idx = matched.index[0]

    # Us movie ki similarity scores sabse movies se
    # similarity[idx] ek array hai — har movie ke saath kitna similar hai
    distances = similarity[idx]

    # Sort karo descending order mein
    # [0] skip karo — wo movie khud hai (similarity = 1.0)
    # [1:6] — next 5 most similar movies
    top5 = sorted(
        list(enumerate(distances)),
        reverse=True,
        key=lambda x: x[1]
    )[1:6]

    return [movies.iloc[i[0]].title for i in top5]


# ── STEP 5: API Endpoints ─────────────────────────────────────

@app.get("/recommend/{movie_name}")
def get_recommendation(movie_name: str):
    """
    GET /recommend/Inception
    → {"movie": "Inception", "recommendations": [...5 movies...]}
    """
    try:
        recs = recommend(movie_name)
        return {"movie": movie_name, "recommendations": recs}
    except ValueError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Server error"})


@app.get("/movies")
def get_movies():
    """
    GET /movies
    → {"movies": ["Avatar", "Batman"...], "total": 4806}
    Frontend autocomplete ke liye use hota hai
    """
    if movies is None:
        return JSONResponse(status_code=503, content={"error": "Not loaded"})
    return {
        "movies": sorted(movies['title'].dropna().tolist()),
        "total": len(movies)
    }


# ── STEP 6: Frontend serve karo ──────────────────────────────
# FastAPI khud index.html, style.css, script.js serve karega
# isliye alag server ki zaroorat nahi
frontend_dir = BASE_DIR / "frontend"
if frontend_dir.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(frontend_dir), html=True),
        name="frontend"
    )