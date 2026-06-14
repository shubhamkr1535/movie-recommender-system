/* ══════════════════════════════════════════════════════════════
   MovieMatch — script.js
   FastAPI: GET /recommend/{movie_name}  |  GET /movies
══════════════════════════════════════════════════════════════ */
"use strict";

/* ─────────────────────────────────────────────────────────────
   API URL — blank rakho agar FastAPI khud frontend serve kare
   (Render deploy ke liye bhi blank hi sahi hai)
   
   Agar alag port pe run ho (jaise Live Server) tab:
   const API_BASE_URL = "http://127.0.0.1:8000";
───────────────────────────────────────────────────────────── */
const API_BASE_URL = "https://movie-recommender-system-uaq8.onrender.com";
// 4287ad07b7b6ed2b7ea51c1b56ac3bdf
// NAYI lines (ye daalo):
const OMDB_KEY = "http://www.omdbapi.com/?i=tt3896198&apikey=25960589";  // ← yahan apni OMDb key daalo
const TMDB_URL  = "https://api.themoviedb.org/3/search/movie";
const TMDB_IMG  = "https://image.tmdb.org/t/p/w342";

/* ── DOM ── */
const movieInput       = document.getElementById("movieInput");
const clearBtn         = document.getElementById("clearBtn");
const findBtn          = document.getElementById("findBtn");
const autocompleteDD   = document.getElementById("autocompleteDropdown");
const searchHint       = document.getElementById("searchHint");
const loadingSection   = document.getElementById("loadingSection");
const errorSection     = document.getElementById("errorSection");
const errorMsg         = document.getElementById("errorMsg");
const resultsSection   = document.getElementById("resultsSection");
const resultMovieTitle = document.getElementById("resultMovieTitle");
const cardsGrid        = document.getElementById("cardsGrid");

/* ── STATE ── */
let acTimer     = null;
let acIndex     = -1;
let posterCache = {};
let movieList   = [];

/* ══════════════════════════════════════════════════════════════
   PAGE LOAD — /movies se poori list fetch karo
══════════════════════════════════════════════════════════════ */
async function loadMovieList() {
  try {
    const res = await fetch(`${API_BASE_URL}/movies`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data))              movieList = data;
    else if (Array.isArray(data.movies))  movieList = data.movies;
    else if (Array.isArray(data.movie_list)) movieList = data.movie_list;
    console.log(`✅ ${movieList.length} movies loaded for autocomplete`);
  } catch (e) {
    console.warn("Movie list load nahi hui:", e.message);
  }
}

/* ══════════════════════════════════════════════════════════════
   RECOMMENDATIONS — /recommend/{movie_name}
══════════════════════════════════════════════════════════════ */
async function getRecommendations(movieName) {
  const url = `${API_BASE_URL}/recommend/${encodeURIComponent(movieName)}`;
  const res = await fetch(url);

  let data;
  try { data = await res.json(); } catch { throw new Error("Server se response nahi mila."); }

  if (!res.ok) {
    throw new Error(data.error || `Server error: ${res.status}`);
  }
  if (!data.recommendations || data.recommendations.length === 0) {
    throw new Error(`"${movieName}" database mein nahi mili ya koi match nahi.`);
  }
  return data.recommendations.slice(0, 5);
}

/* ══════════════════════════════════════════════════════════════
   TMDB POSTER FETCH
══════════════════════════════════════════════════════════════ */

async function fetchPoster(title) {
  if (posterCache[title]) return posterCache[title];
  try {
    const res  = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${encodeURIComponent(title)}&type=movie`);
    const data = await res.json();
    const result = {
      posterPath: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
      year: data.Year || "",
    };
    posterCache[title] = result;
    return result;
  } catch {
    return { posterPath: null, year: "" };
  }
}
/* ══════════════════════════════════════════════════════════════
   MAIN SEARCH
══════════════════════════════════════════════════════════════ */
async function triggerSearch() {
  const movie = movieInput.value.trim();
  if (!movie) {
    setHint("Pehle koi movie ka naam likho!", true);
    movieInput.focus();
    return;
  }

  closeAC();
  showState("loading");

  try {
    const recs    = await getRecommendations(movie);
    const posters = await Promise.all(recs.map(fetchPoster));

    resultMovieTitle.textContent = movie;
    cardsGrid.innerHTML = recs.map((title, i) => buildCard(title, i + 1, posters[i])).join("");

    cardsGrid.querySelectorAll(".movie-card").forEach(card => {
      card.addEventListener("click", () => {
        movieInput.value = card.dataset.title;
        window.scrollTo({ top: 0, behavior: "smooth" });
        triggerSearch();
      });
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") card.click();
      });
    });

    showState("results");
  } catch (err) {
    showError(err.message || "Kuch galat ho gaya. Dobara try karo.");
  }
}

/* ══════════════════════════════════════════════════════════════
   CARD HTML
══════════════════════════════════════════════════════════════ */
function buildCard(title, rank, { posterPath, year } = {}) {
  const imgHtml = posterPath
    ? `<img src="${esc(posterPath)}" alt="${esc(title)} poster" loading="lazy"
           onerror="this.parentNode.innerHTML=fallbackPoster('${esc(title).replace(/'/g, "&#39;")}')">`
    : fallbackPoster(title);

  return `
    <div class="movie-card" data-title="${esc(title)}" role="button" tabindex="0"
         aria-label="Find movies similar to ${esc(title)}">
      <div class="card-poster">
        ${imgHtml}
        <div class="rank-badge">${rank}</div>
        <div class="card-shine"></div>
      </div>
      <div class="card-body">
        <div class="card-title">${esc(title)}</div>
        ${year ? `<div class="card-year">${year}</div>` : ""}
        <div class="card-cta">Find similar →</div>
      </div>
    </div>`;
}

function fallbackPoster(title) {
  return `<div class="poster-fallback">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="m10 9 5 3-5 3V9Z"/>
      <path d="M7 21h10M12 17v4"/>
    </svg>
    <span>${esc(title)}</span>
  </div>`;
}

/* ══════════════════════════════════════════════════════════════
   AUTOCOMPLETE
══════════════════════════════════════════════════════════════ */
function getACResults(query) {
  if (!movieList.length) return [];
  const q = query.toLowerCase();
  return movieList.filter(m => m.toLowerCase().includes(q)).slice(0, 8);
}

function renderAC(items) {
  if (!items.length) { closeAC(); return; }
  autocompleteDD.innerHTML = items.map(t =>
    `<div class="ac-item" data-title="${esc(t)}">
       <span class="ac-icon">▶</span>${esc(t)}
     </div>`
  ).join("");
  autocompleteDD.classList.add("open");
  acIndex = -1;
  autocompleteDD.querySelectorAll(".ac-item").forEach(el =>
    el.addEventListener("mousedown", e => {
      e.preventDefault();
      movieInput.value = el.dataset.title;
      closeAC();
      triggerSearch();
    })
  );
}

function closeAC() { autocompleteDD.classList.remove("open"); acIndex = -1; }

function highlightAC(items) {
  items.forEach((el, i) => el.classList.toggle("active", i === acIndex));
  if (acIndex >= 0) movieInput.value = items[acIndex].dataset.title;
}

/* ══════════════════════════════════════════════════════════════
   UI STATE
══════════════════════════════════════════════════════════════ */
function showState(state) {
  loadingSection.classList.remove("active");
  errorSection.classList.remove("active");
  resultsSection.classList.remove("active");
  findBtn.disabled = false;

  if (state === "loading") {
    loadingSection.classList.add("active");
    findBtn.disabled = true;
  } else if (state === "results") {
    resultsSection.classList.add("active");
    setTimeout(() => resultsSection.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  } else if (state === "error") {
    errorSection.classList.add("active");
  }
}

function showError(msg) { errorMsg.textContent = msg; showState("error"); }

function setHint(msg, isErr = false) {
  searchHint.textContent = msg;
  searchHint.style.color = isErr ? "var(--danger)" : "";
}

function clearAndReset() {
  movieInput.value = "";
  clearBtn.classList.remove("visible");
  showState("idle");
  setHint("Type a movie name and press Enter or click Find Movies");
  movieInput.focus();
}

/* ══════════════════════════════════════════════════════════════
   EVENTS
══════════════════════════════════════════════════════════════ */
movieInput.addEventListener("input", () => {
  const val = movieInput.value;
  clearBtn.classList.toggle("visible", val.length > 0);
  clearTimeout(acTimer);
  const q = val.trim();
  if (q.length < 2) { closeAC(); return; }
  acTimer = setTimeout(() => renderAC(getACResults(q)), 180);
});

movieInput.addEventListener("keydown", e => {
  const items = autocompleteDD.querySelectorAll(".ac-item");
  if      (e.key === "ArrowDown")  { acIndex = Math.min(acIndex + 1, items.length - 1); highlightAC(items); e.preventDefault(); }
  else if (e.key === "ArrowUp")    { acIndex = Math.max(acIndex - 1, -1);               highlightAC(items); e.preventDefault(); }
  else if (e.key === "Enter")      { if (acIndex >= 0 && items[acIndex]) { movieInput.value = items[acIndex].dataset.title; closeAC(); } triggerSearch(); }
  else if (e.key === "Escape")     closeAC();
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search-field") && !e.target.closest(".autocomplete-dropdown")) closeAC();
});

clearBtn.addEventListener("click", clearAndReset);
findBtn.addEventListener("click", triggerSearch);

function esc(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

/* ── INIT ── */
loadMovieList();
