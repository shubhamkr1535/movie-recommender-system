from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pickle
import pandas as pd
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

def _load(p):
    try:
        return pickle.load(open(p, "rb"))
    except Exception as e:
        print(f"Warning: {p}: {e}")
        return None

movies     = _load(BASE_DIR / "movie_list.pkl")
similarity = _load(BASE_DIR / "similarity.pkl.")

def recommend(movie: str):
    if movies is None or similarity is None:
        raise RuntimeError("Model not loaded")
    matched = movies[movies['title'] == movie]
    if matched.empty:
        matched = movies[movies['title'].str.lower() == movie.lower()]
    if matched.empty:
        raise ValueError(f"Movie '{movie}' not found")
    idx = matched.index[0]
    distances = similarity[idx]
    top5 = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:6]
    return [movies.iloc[i[0]].title for i in top5]

@app.get("/recommend/{movie_name}")
def get_recommendation(movie_name: str):
    try:
        return {"movie": movie_name, "recommendations": recommend(movie_name)}
    except ValueError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Server error"})

@app.get("/movies")
def get_movies():
    if movies is None:
        return JSONResponse(status_code=503, content={"error": "Not loaded"})
    return {"movies": sorted(movies['title'].dropna().tolist()), "total": len(movies)}

# Frontend serve karo — SABSE LAST mein
frontend_dir = BASE_DIR / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
