# 🎬 MovieMatch — Movie Recommender System


**A content-based movie recommendation system powered by Machine Learning.**  
Search any movie and instantly get 5 similar movie recommendations with posters.

## 📸 Preview

> Search a movie → Get 5 recommendations → See posters + release year → Click any card to explore further

---

## ✨ Features

- 🔍 **Smart Search** — Live autocomplete with 4800+ movies
- 🤖 **ML-Powered** — Content-based filtering using cosine similarity
- 🎭 **Movie Posters** — Real posters fetched via OMDb API
- ⚡ **Fast API** — Built with FastAPI + Uvicorn
- 🎨 **Cinematic UI** — Dark theme frontend with smooth animations
- 📱 **Responsive** — Works on desktop and mobile
- 🚀 **Deployable** — Ready for Render / Railway deployment

---

## 🧠 How It Works

```
User types movie name
        ↓
FastAPI receives request → /recommend/{movie_name}
        ↓
ML Model finds movie index in movie_list.pkl
        ↓
Cosine Similarity calculated using similarity.pkl
        ↓
Top 5 most similar movies returned
        ↓
Frontend fetches poster for each movie via OMDb API
        ↓
5 movie cards displayed with poster + title + year
```

The recommendation engine uses **TF-IDF Vectorization** on movie metadata (genres, keywords, cast, crew, overview) combined with **Cosine Similarity** to find the most similar movies.

---

## 🗂️ Project Structure

```
movie-recommender-system/
│
├── moviematch/                  # Main project folder
│   ├── main.py                  # FastAPI backend
│   ├── requirements.txt         # Python dependencies
│   ├── movie_list.pkl           # Processed movie DataFrame (4806 movies)
│   ├── similarity.pkl           # Cosine similarity matrix (Git LFS)
│   │
│   └── frontend/                # Pure HTML/CSS/JS frontend
│       ├── index.html           # Main page structure
│       ├── style.css            # Cinematic dark theme styles
│       └── script.js            # API calls, autocomplete, poster fetch
│
├── Movie Recommender System.ipynb   # ML model notebook
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **ML Model** | Python, Pandas, Scikit-learn, NLTK |
| **Vectorization** | TF-IDF / Count Vectorizer |
| **Similarity** | Cosine Similarity |
| **Backend** | FastAPI, Uvicorn |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Poster API** | OMDb API |
| **Dataset** | TMDB 5000 Movies Dataset |
| **Deployment** | Render |

---

## ⚙️ Local Setup

### Prerequisites

- Python 3.10+
- Git + Git LFS (for cloning large `.pkl` files)

### Step 1 — Clone the repository

```bash
git lfs install
git clone https://github.com/shubhamkr1535/movie-recommender-system.git
cd movie-recommender-system/moviematch
```

### Step 2 — Install dependencies

```bash
pip install -r requirements.txt
```

### Step 3 — Get OMDb API Key (Free)

1. Go to [https://www.omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)
2. Select **Free** plan → Enter your email → Submit
3. Check your email → Click the activation link
4. Copy your API key

### Step 4 — Add API key to script.js

Open `frontend/script.js` and update line at the top:

```js
const OMDB_KEY = "your_omdb_api_key_here";
```

### Step 5 — Run the server

```bash
uvicorn main:app --reload
```

### Step 6 — Open in browser

```
http://127.0.0.1:8000
```

---


## 🚀 Deploy on Render

1. Push code to GitHub (make sure `similarity.pkl` is uploaded via Git LFS)

2. Go to [render.com](https://render.com) → **New Web Service**

3. Connect your GitHub repository

4. Set the following:

| Setting | Value |
|---------|-------|
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Root Directory** | `moviematch` |

5. Click **Deploy** ✅

---

## 📊 Dataset

- **Source:** [TMDB 5000 Movies Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata)
- **Total Movies:** 4,806
- **Features Used:** genres, keywords, cast, crew, overview

---

## 🧪 ML Model Details

The notebook `Movie Recommender System.ipynb` covers:

1. **Data Loading** — Load and merge TMDB movies + credits datasets
2. **Feature Engineering** — Extract genres, keywords, top 3 cast, director
3. **Text Preprocessing** — Stemming using NLTK PorterStemmer
4. **Vectorization** — CountVectorizer (5000 features, stop words removed)
5. **Similarity** — Cosine similarity matrix computed on all 4806 movies
6. **Export** — Save `movie_list.pkl` and `similarity.pkl` using pickle

---

## 📁 Large File Handling

`similarity.pkl` is larger than GitHub's 25MB limit and is tracked using **Git LFS**.

To clone with the large file:
```bash
git lfs install
git clone https://github.com/shubhamkr1535/movie-recommender-system.git
```

To generate `similarity.pkl` yourself, run the Jupyter notebook:
```bash
jupyter notebook "Movie Recommender System.ipynb"
```

---

## 🙋‍♂️ Author

**Shubham Kumar**

- GitHub: [@shubhamkr1535](https://github.com/shubhamkr1535)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ and Machine Learning
</div>
