# Trin's Trinkets 🐚

A cozy, single-player 3D beachcombing and collection game made with Three.js.

Walk along a pastel shoreline, collect shells and sea glass, sell duplicates at a self-serve exchange, work your way from a shovel to a metal detector, complete collections, and arrange your favorite finds in a cottage display room.

## Run locally

Node.js 20 or newer:

```bash
npm install
npm run dev
```

Open the URL Vite prints.

## Controls

- **WASD** to wander; **mouse** to look
- **E** to collect a nearby find or interact with a station
- **F** to scan with an owned metal detector
- **J** collection journal, **B** backpack, **H** display shelf
- **Esc** to unlock the pointer or close the current panel
- In shelf mode, drag treasures to arrange them; **Q / R** to rotate selected treasure.

All progress is saved in the browser with localStorage. No account, backend, character models, purchases, or multiplayer required.

## Deploy

GitHub Actions contains a Pages build workflow. Enable **Settings → Pages → Build and deployment → GitHub Actions** on this repository, then push to main or run the workflow manually.

## Project structure

- `src/world.js`: procedural beach, cottage interior, pickable 3D finds, and decorative objects.
- `src/catalog.js`: items and rarity / tool progression.
- `src/main.js`: game state, interactions, collection / shop UI, shelf customization and saves.
- `src/style.css`: cozy UI.
