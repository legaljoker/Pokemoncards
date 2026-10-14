# My Pokémon Cards

A phone-friendly website for browsing my Pokémon card collection.

**Site:** https://legaljoker.github.io/Pokemoncards/
**Add / edit cards:** https://legaljoker.github.io/Pokemoncards/admin.html

## Features
- Grid of cards that works on phones and computers; search by name, set, number or notes.
- Tap a card to see it full screen; tap the card (or **Show back**) to flip it; swipe left/right for the next card.
- Add cards from a phone or PC — no software to install:
  - **Binder page photo**: line up a grid (2×4, 4×2, 3×3, …) and it cuts the photo into separate cards.
  - **Single card photos**: one card per photo.
  - The page tries to **read the card name** from the photo (OCR). Always double-check it.
- **Edit cards**: rename, add/replace front or back photos, delete.

## One-time setup
1. **Turn on the website:** repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, Save.
2. **Create a token** so the add page can save: GitHub → Settings → Developer settings →
   [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new) → Generate new token.
   - Repository access: *Only select repositories* → `Pokemoncards`
   - Permissions → Repository permissions → **Contents: Read and write**
3. Open the add page, go to **Settings**, paste the token, tap **Save & test**. Do this once on each device.

The token is stored only in that browser. Anyone can view the site, but only someone with the token can change it.

## How it's stored
- `data/cards.json` — the list of cards (name, set, number, notes, image paths).
- `images/cards/` — photos (resized to 1400px, plus a small thumbnail for the grid).

Every save is a normal commit in this repo, so you can undo mistakes from the GitHub history.
