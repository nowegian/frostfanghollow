# Frostfang Hollow Link

An original frozen-Halloween slot game with a Hold & Spin orb bonus, four jackpots and a Moonrise Bonus where Frostfang's grid travels and grows. It runs in the browser and uses play money only: nothing to buy, nothing to win.

- **`index.html`**: desktop game
- **`mobile.html`**: phone game, for a phone held upright

## Play it

Both pages are static, so any web host works. To publish with GitHub Pages, open **Settings → Pages**, set the source to **Deploy from a branch**, and pick `main` / `/ (root)`. The game is then served at:

- `https://nowegian.github.io/frostfanghollow/` (desktop)
- `https://nowegian.github.io/frostfanghollow/mobile.html` (phone)

To play locally, serve the folder rather than double-clicking the file, because the voice lines load from `audio/`:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/ or http://localhost:8000/mobile.html
```

## Game features

- 5 reels by 3 rows, 243 ways to win, with Wild on reels 2–5
- Bets from $0.50 to $25.00: 1¢, 2¢ or 5¢ at 1×, 2×, 3×, 5× or 10× (50 to 500 credits). Each session starts with $100, with ADD $100 and RESET
- **Hold & Spin**: 6 or more orbs lock in place with 3 spins that reset on every new orb, and every empty spot spins on its own. Filling all 15 spots doubles the win
- **Jackpots**: MINI (20× bet), MINOR (50×), MAJOR (300×, grows), and GRAND (starts at $9,000 at every bet, grows). The GRAND orb is more likely at bigger bets
- **Moonrise Bonus**: moons on reels 1, 3 and 5 grow the reels to 8 rows. A solid grid shape with Frostfang inside travels to collect diamonds and grows from 2×2 up to 8×5. Every diamond resets the spins to 3, and Frostfang throws prize snowballs. Every bonus pays at least 5× the bet
- Real reel strips with motion blur and suspense on reel 5, SPEED 1–4, synthesized music and effects, and voice lines for Frostfang
- A $ / CR toggle for the credit, bet and win displays

## Payout

The game is built to the Minnesota tribal-state compact payout rule for games not affected by skill: at least 80% and at most 95% of the amount wagered (95% used as the cap). The theoretical return is **about 93.5% at every bet**. This was measured with tens of millions of simulated spins, including the 1% of each bet that grows the MAJOR and GRAND meters. Every jackpot's odds are far inside the compacts' limits on top-award probability.

This is a play-money game. A real-money machine needs independent lab certification and approval by the Minnesota Department of Public Safety.

## Repository layout

| Path | What it is |
|---|---|
| `index.html`, `mobile.html` | Built, playable pages (all code inlined) |
| `img/` | Artwork: symbols, jackpot orbs, Frostfang poses, frames, backgrounds, logo, plaques, spin button (WebP) |
| `audio/voice/`, `audio/manifest.json` | Frostfang's voice lines; the manifest lists which lines have recordings |
| `src/engine.js` | Game maths: reels, pays, Hold & Spin, Moonrise Bonus, jackpots |
| `src/art.js` | Drawn fallback art for anything without an image file |
| `src/sound.js` | Synthesized music and effects; plays recorded voice lines when available |
| `src/ui.html` | Desktop page template |
| `src/make_mobile.py` | Generates the phone template (`src/ui_mobile.html`) from the desktop one |
| `build.sh` | Rebuilds `index.html` and `mobile.html` from `src/` |
| `tools/` | Payout simulator |

## Editing

1. Change files in `src/`, then run `./build.sh` to rebuild both pages.
2. Check the payout after any maths change, for example 2 × 4,000,000 spins at a $1 bet:

   ```bash
   UNIT=0.02 tools/runmany4.sh 4000000 2 1
   ```

   The printed RTP leaves out the GRAND, which adds a fixed 4% at every bet.

**Adding voice lines:** put an MP3 in `audio/voice/`, named after the line in lowercase with underscores (for example `mine_mine.mp3` for "Mine! Mine!"), and add the name to `voice` in `audio/manifest.json`.
