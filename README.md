# Trin's Trinkets 🐚

A cozy, single-player 3D beachcombing and collection game made with Three.js.

Explore a small sheltered seaside cove, gather a limited selection of treasures each day, sell duplicates at the self-serve beach exchange, work from a shovel up to a metal detector, complete collections, and decorate a cottage display room. Go to sleep in the cottage to wake up to a fresh tide of finds.

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
- **J** collection journal, **B** backpack, **H** cottage and display shelf
- **Sleep until morning** from the cottage to advance a day and bring in the next tide
- **Esc** to unlock the pointer or close the current panel
- In shelf mode, drag treasures to arrange them; **Q / R** to rotate selected treasure.

All progress—including the current day and the remaining finds on the beach—is saved in the browser with localStorage. Reloading does not respawn treasures; only sleeping does. No account, backend, character models, purchases, or multiplayer required.

## Deploy

GitHub Actions contains a Pages build workflow. Enable **Settings → Pages → Build and deployment → GitHub Actions** on this repository, then push to main or run the workflow manually.

## Project structure

- `src/world.js`: procedural beach, cottage interior, pickable 3D finds, and decorative objects.
- `src/catalog.js`: items and rarity / tool progression.
- `src/main.js`: game state, interactions, collection / shop UI, shelf customization and saves.
- `src/style.css`: cozy UI.

## Daily beach loop

Each morning, the tide leaves a small batch of nine surface finds, five dig sites, and four buried detector signals. Dig and detector discoveries become accessible when those tools are purchased. A day's finds disappear when collected and stay gone on refresh. Sleeping in the cottage advances the day and refreshes the beach; collection and room decorations carry over.
