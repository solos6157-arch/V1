from pathlib import Path
import json
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
SONGS_DIR = ROOT / "songs"
COVERS_DIR = ROOT / "thumbnails"
AUDIO_EXTENSIONS = {".mp3", ".m4a", ".ogg", ".wav", ".aac", ".flac"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".avif"}

def web_path(path: Path) -> str:
    # Quote spaces and special characters, while preserving folder separators.
    return quote(path.relative_to(ROOT).as_posix(), safe="/-_.~")

def title_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    return re.sub(r"[_-]+", " ", stem).strip() or stem

def main():
    SONGS_DIR.mkdir(exist_ok=True)
    COVERS_DIR.mkdir(exist_ok=True)
    cover_lookup = {}
    for cover in COVERS_DIR.iterdir():
        if cover.is_file() and cover.suffix.lower() in IMAGE_EXTENSIONS:
            cover_lookup.setdefault(cover.stem.casefold(), cover)

    audio_files = sorted(
        (p for p in SONGS_DIR.iterdir()
         if p.is_file() and p.suffix.lower() in AUDIO_EXTENSIONS),
        key=lambda p: p.name.casefold()
    )
    tracks = []
    for audio in audio_files:
        cover = cover_lookup.get(audio.stem.casefold())
        tracks.append({
            "title": title_from_filename(audio.name),
            "artist": "NAKRI x OG",
            "file": web_path(audio),
            "cover": web_path(cover) if cover else "",
            "duration": audio.suffix[1:].upper()
        })

    (ROOT / "songs.json").write_text(
        json.dumps(tracks, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"Found {len(tracks)} audio file(s). Updated songs.json.")
    if not tracks:
        print("No audio files found. Put MP3/audio files in the songs folder, then run this script again.")
    else:
        print("Tracks:")
        for track in tracks:
            print(f" - {track['title']} -> {track['file']}")
    print("If you add or rename files later, run this script again before uploading to GitHub.")

if __name__ == "__main__":
    main()
