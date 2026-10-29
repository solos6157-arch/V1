const audio = document.getElementById("audio");
const grid = document.getElementById("songGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const emptyState = document.getElementById("emptyState");
const trackCount = document.getElementById("trackCount");
const playBtn = document.getElementById("playBtn");
const seekBar = document.getElementById("seekBar");
let songs = [];
let visibleSongs = [];
let currentIndex = -1;

document.getElementById("year").textContent = new Date().getFullYear();
audio.volume = 0.8;

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
function coverMarkup(song, extraClass = "") {
  if (song.cover) {
    return `<img class="${extraClass}" src="${song.cover}" alt="${escapeHTML(song.title)} cover" loading="lazy" onerror="this.remove();this.parentElement.classList.add('cover-failed')">`;
  }
  return `<div class="cover-placeholder ${extraClass}" aria-label="No cover image">♫</div>`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function renderSongs() {
  const query = searchInput.value.trim().toLowerCase();
  visibleSongs = songs.map((song, index) => ({...song, originalIndex:index}))
    .filter(song => `${song.title} ${song.artist}`.toLowerCase().includes(query));
  if (sortSelect.value === "name") visibleSongs.sort((a,b) => a.title.localeCompare(b.title));
  grid.innerHTML = "";
  trackCount.textContent = `${visibleSongs.length} TRACK${visibleSongs.length === 1 ? "" : "S"}`;
  emptyState.hidden = visibleSongs.length !== 0;
  visibleSongs.forEach(song => {
    const card = document.createElement("article");
    card.className = "song-card" + (song.originalIndex === currentIndex ? " is-playing" : "");
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Play ${song.title} by ${song.artist}`);
    const cover = document.createElement("div");
    cover.className = "cover-wrap";
    if (song.cover) {
      const img = document.createElement("img");
      img.src = song.cover; img.alt = `${song.title} cover`; img.loading = "lazy";
      img.onerror = () => { cover.innerHTML = '<div class="cover-placeholder">♫</div>'; };
      cover.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "cover-placeholder"; placeholder.textContent = "♫";
      cover.appendChild(placeholder);
    }
    const button = document.createElement("button");
    button.className = "card-play"; button.type = "button";
    button.setAttribute("aria-label", `Play ${song.title}`);
    button.textContent = song.originalIndex === currentIndex && !audio.paused ? "Ⅱ" : "▶";
    button.addEventListener("click", event => { event.stopPropagation(); playSong(song.originalIndex); });
    cover.appendChild(button);
    const title = document.createElement("h3"); title.className = "song-title"; title.textContent = song.title;
    const artist = document.createElement("div"); artist.className = "song-artist"; artist.textContent = song.artist;
    const meta = document.createElement("div"); meta.className = "song-meta";
    const label = document.createElement("span"); label.textContent = "NAKRI × OG";
    const duration = document.createElement("span"); duration.textContent = song.duration || "MP3";
    meta.append(label, duration);
    card.append(cover, title, artist, meta);
    card.addEventListener("click", () => playSong(song.originalIndex));
    card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); playSong(song.originalIndex); } });
    grid.appendChild(card);
  });
}
function updateNowPlaying(song) {
  document.getElementById("nowTitle").textContent = song.title;
  document.getElementById("nowArtist").textContent = song.artist;
  const mini = document.getElementById("miniCover");
  mini.innerHTML = "";
  if (song.cover) {
    const img = document.createElement("img"); img.src = song.cover; img.alt = "";
    img.onerror = () => { mini.textContent = "♫"; }; mini.appendChild(img);
  } else mini.textContent = "♫";
}
async function playSong(index) {
  if (!songs[index]) return;
  if (currentIndex === index) {
    if (audio.paused) { try { await audio.play(); } catch (error) { showAudioError(); } }
    else audio.pause();
    return;
  }
  currentIndex = index;
  const song = songs[index];
  audio.src = song.file;
  updateNowPlaying(song);
  renderSongs();
  try { await audio.play(); } catch (error) { showAudioError(); }
}
function showAudioError() {
  document.getElementById("nowArtist").textContent = "Could not play file — check the song path";
}
function playNext(direction = 1) {
  if (!songs.length) return;
  const next = currentIndex < 0 ? 0 : (currentIndex + direction + songs.length) % songs.length;
  playSong(next);
}
searchInput.addEventListener("input", renderSongs);
sortSelect.addEventListener("change", renderSongs);
playBtn.addEventListener("click", async () => {
  if (currentIndex < 0) { if (songs.length) await playSong(0); return; }
  if (audio.paused) { try { await audio.play(); } catch (error) { showAudioError(); } }
  else audio.pause();
});
document.getElementById("prevBtn").addEventListener("click", () => {
  if (audio.currentTime > 3) audio.currentTime = 0;
  else playNext(-1);
});
document.getElementById("nextBtn").addEventListener("click", () => playNext(1));
document.getElementById("volumeBar").addEventListener("input", event => { audio.volume = Number(event.target.value); });
audio.addEventListener("play", () => { playBtn.textContent = "Ⅱ"; playBtn.setAttribute("aria-label","Pause"); renderSongs(); });
audio.addEventListener("pause", () => { playBtn.textContent = "▶"; playBtn.setAttribute("aria-label","Play"); renderSongs(); });
audio.addEventListener("loadedmetadata", () => { document.getElementById("duration").textContent = formatTime(audio.duration); });
audio.addEventListener("timeupdate", () => {
  document.getElementById("currentTime").textContent = formatTime(audio.currentTime);
  if (Number.isFinite(audio.duration) && audio.duration > 0) seekBar.value = String(Math.round(audio.currentTime / audio.duration * 1000));
});
seekBar.addEventListener("input", () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seekBar.value) / 1000 * audio.duration; });
audio.addEventListener("ended", () => playNext(1));
async function loadLibrary() {
  try {
    const libraryUrl = new URL("songs.json", document.baseURI);
    const response = await fetch(libraryUrl, {cache:"no-store"});
    if (!response.ok) throw new Error("songs.json not found");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("songs.json must contain a list");
    songs = data.filter(item => item && item.file).map(item => ({
      title: safeText(item.title, "Untitled track"),
      artist: safeText(item.artist, "NAKRI x OG"),
      // Resolve paths relative to the site, which also works for GitHub project pages.
      file: new URL(item.file, document.baseURI).href,
      cover: item.cover ? new URL(item.cover, document.baseURI).href : "",
      duration: safeText(item.duration, "MP3")
    }));
    renderSongs();
    if (songs.length === 0) {
      emptyState.hidden = false;
      emptyState.querySelector("h3").textContent = "No songs added yet";
      emptyState.querySelector("p").textContent = "Add audio files to the songs folder, run build_songs.py, then upload songs.json and the songs folder to GitHub.";
    }
  } catch (error) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h3").textContent = "Your music library could not load";
    emptyState.querySelector("p").textContent = "Make sure songs.json is uploaded beside index.html and contains valid JSON. Run build_songs.py after adding songs.";
    trackCount.textContent = "0 TRACKS";
    console.error("Could not load music library:", error);
  }
}
loadLibrary();
