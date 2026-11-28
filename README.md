# Frostfang Hollow Link

An original frozen-Halloween slot game with Moonrise Free Games, a Snowball Fight and five jackpots. It runs in the browser and uses play money only: nothing to buy, nothing to win.

- **`index.html`**: desktop game
- **`mobile.html`**: phone game, for a phone held upright. Phones that open `index.html` are sent here automatically, and the phone menu has a DESKTOP VERSION button

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

- 5 reels by 3 rows, 50 fixed paylines, with Wild on reels 2–5.
- Bets from $0.50 to $12.50: 1¢, 2¢ or 5¢ at 1 to 5 credits per line (50 to 250 credits), e.g. 1¢ gives $0.50, $1.00, $1.50, $2.00 or $2.50. New players start with $100, the balance is saved between visits, and ADD $100 tops it up
- **Snowball Fight jackpot feature**: any wild on a regular spin can start it (more often at more credits per line). Pick from 15 snowballs until 3 match. MINI (1,000 credits) and MINOR (5,000 credits) follow the denomination; MAXI ($1,000), MAJOR ($6,000) and GRAND ($12,000) are shared progressives in dollars, the same at every denomination, more likely at bigger bets
- **Moonrise Free Games**: moons are scatters. 3, 4 or 5 anywhere pay 2×, 10× or 50× the bet and start 6 free games; 1 or 2 moons can also start them at random. In free games the card symbols (A, K, Q, J, 10) are removed. 3+ moons in free games add 6 more
- **Frostfang** is the top-paying symbol on every reel
- **Diamond Hunt**: the dancing Frostfang on reel 1 plus a gem on reels 2–5 starts it. Sapphire adds double symbols (two-value diamonds and gold coins, +1 SPIN double diamonds and coins that also carry a value), ruby lets the grid grow past 5×5 to 8×5, emerald adds 2 starting spins (3 → 5). The board grows to 8×5; gold coins pay inside Frostfang's grid, +1 SPIN gold coins land only inside it, and coins and diamonds can hold any of the five jackpots, diamonds land only outside it and he travels to collect them. Gems on regular spins show a credit value or jackpot; they block lines, but when the hunt starts they turn into diamonds in the same spots and keep their value. `tools/hunt_tests.js` checks the rules and `tools/huntsim.js` reports every gem combination
- Every bonus prize comes in steps of 10 credits, so bonus totals are always round
- Real reel strips with motion blur and suspense on reel 5, SPEED 1–4, synthesized music and effects, and voice lines for Frostfang
- A $ / CR toggle for the credit, bet and win displays

## Shared jackpots and saved progress

When the game runs as a Claude artifact, it uses the artifact's database:

- **Shared progressive jackpots:** every player's spins feed one MAJOR and one GRAND meter, shown live to everyone. When anyone wins, that meter resets for all players.
- **Saved progress:** each signed-in player's balance, bet and settings are saved privately to their account and follow them across devices.
- **Access:** players need Contributor access to save and to feed the jackpots. Viewers can play and watch the meters.

Hosted anywhere else, such as GitHub Pages, there's no database, so the game saves in the browser only and each player has their own jackpot meters.

## Payout

The game is built to the Minnesota tribal-state compact payout rule for games not affected by skill: at least 80% and at most 95% of the amount wagered (95% used as the cap). The theoretical return is **about 93.3% at every bet**. This was measured with tens of millions of simulated spins, including the 1% of each bet that grows the MAJOR and GRAND meters. Every jackpot's odds are far inside the compacts' limits on top-award probability.

This is a play-money game. A real-money machine needs independent lab certification and approval by the Minnesota Department of Public Safety.

## Repository layout

| Path | What it is |
|---|---|
| `index.html`, `mobile.html` | Built, playable pages (all code inlined) |
| `img/` | Artwork: symbols, jackpot orbs, Frostfang poses, frames, backgrounds, logo, plaques, spin button (WebP) |
| `audio/voice/`, `audio/manifest.json` | Frostfang's voice lines; the manifest lists which lines have recordings |
| `src/engine.js` | Game maths: reels, pays, free games, Snowball Fight, jackpots |
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
