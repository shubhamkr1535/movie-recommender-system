from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pickle
import gzip
import pandas as pd
from pathlib import Path

app = FastAPI()

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── LOAD PICKLE FILES ──
BASE_DIR = Path(__file__).resolve().parent

def _load_pickle(p: Path):
    try:
        if not p.exists():
            raise FileNotFoundError(f"{p} does not exist")
        # Support gzip-compressed pickles and plain pickles
        suff = p.suffix.lower()
        if suff == ".gz":
            with gzip.open(p, "rb") as f:
                return pickle.load(f)
        return pickle.load(open(p, "rb"))
    except Exception as e:
        print(f"Warning: could not load pickle {p}: {e}")
        return None

movies     = _load_pickle(BASE_DIR / "movie_list.pkl")
similarity = _load_pickle(BASE_DIR / "similarity.pkl.gz")

# ── RECOMMEND FUNCTION ──
def recommend(movie: str):
    if movies is None or similarity is None:
        raise RuntimeError("Model data not loaded")

    matched = movies[movies['title'] == movie]
    if matched.empty:
        # Case-insensitive fallback
        matched = movies[movies['title'].str.lower() == movie.lower()]
    if matched.empty:
        raise ValueError(f"Movie '{movie}' not found")

    idx = matched.index[0]
    distances = similarity[idx]
    movies_list = sorted(
        list(enumerate(distances)),
        reverse=True,
        key=lambda x: x[1]
    )[1:6]

    return [movies.iloc[i[0]].title for i in movies_list]


# ══════════════════════════════════════════════
#  API ROUTES  (static mount se PEHLE likhna zaroori hai)
# ══════════════════════════════════════════════

@app.get("/recommend/{movie_name}")
def get_recommendation(movie_name: str):
    try:
        recs = recommend(movie_name)
        return {"movie": movie_name, "recommendations": recs}
    except ValueError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})
    except RuntimeError as e:
        return JSONResponse(status_code=503, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Server error"})


@app.get("/movies")
def get_movies():
    """Saari movie titles return karo — autocomplete ke liye"""
    if movies is None:
        return JSONResponse(status_code=503, content={"error": "Movie list not loaded"})
    titles = sorted(movies['title'].dropna().tolist())
    return {"movies": titles, "total": len(titles)}


# ══════════════════════════════════════════════
#  FRONTEND STATIC FILES
#  (ye SABSE LAST mein hona chahiye)
# ══════════════════════════════════════════════
frontend_dir = BASE_DIR / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
