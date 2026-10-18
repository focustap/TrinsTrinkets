# Trin's Trinkets 🐚

A cozy, single-player Three.js beachcombing game about finding beautiful little things and making a cottage feel like home. No account, backend, paid API, or multiplayer.

## Play locally

Use Node.js 20.19+ or 22 LTS:

```sh
npm ci
npm run dev
```

```sh
npm test          # catalog, rarity, progression, migration, tides, inventory and model/shelf geometry
npm run balance  # 1,200 reproducible economy simulations
npm run build
npm run preview  # smoke-test the production bundle
```

## The little daily loop

Explore → collect → keep or sell → decorate → sleep → a new tide.

The beach has nine shoreline discoveries, five buried sites, and four specialized sites. Tools open new pools instead of adding a flood of finds. The cave has twelve daily deposits. The Hidden Moonpool has ten daily sites: six shoreline finds, two pearl beds and two crystal deposits. The Moonpearl Brush and Opal Crystal Scoop make those four extra sites reachable. Item identities, positions and remaining sites save immediately; refreshing cannot reroll a tide. Tools affect future tides, while existing compatible sites can be collected immediately.

There are exactly **230 treasures**, including every original item ID: 40 shells, 26 glass/gems, 34 jewelry/charms, 28 ocean wonders, 24 keepsakes, 28 cave minerals and 20 cave fossils/relics, plus 30 exclusive Moonpool Wonders (10 shells/pearls, 8 coral/minerals, 6 jewelry, 6 ancient discoveries). Every treasure has its own story and visual recipe. Models use shared sculpting families and cached geometry/materials.

## Controls

- **WASD** move, **Shift** walk faster, click the world to capture the mouse.
- **E** collect or interact; **F** scan with an owned detector.
- **J** journal, **B** backpack, **H** cottage; **Esc** closes menus or leaves the cottage.
- The quickbar opens the exchange from anywhere.
- In the cottage, drag an item to snap it to a vacant shelf space. **Q / R** turns the selected piece; **Remove selected** returns it to the backpack.
- Scroll to zoom, right-drag to pan, or choose a focused shelf view.
- Buy the painting kit to paint with 16 colors, four brush sizes, an eraser, undo/redo, and a locally saved wall texture.

## Progression

The equipment ladder runs from a 100-dollar pouch and 175-dollar shovel to the 6,500-dollar detector, then the 12,000-dollar coil and 18,000-dollar professional detector. Brush, sifter and scoop are optional branches. Original shovel/detector owners keep their tools and scanning functionality.

The cave gate is on the east side of the beach. It opens after 30 unique discoveries, ownership of the reinforced trowel, and purchasing cave access for 8,000 dollars. Lantern and pick upgrades reveal further deposits. Cave Mythics require cave access and the geological pick.

At the far end of Mossglass Cave, a luminous formation seals the **Hidden Moonpool**. Purchase access for **12,000 sand dollars** after owning Cave Access, the Geological Pick and discovering **15 different cave-native treasures**. Interacting with the passage lists all four requirements. Both entrances move their rock aside over 1.25 seconds; owned entrances load fully open, with matching traversal boundaries. The surrounding cliff stays intact. Walk through or press E to travel in either direction.

Collection milestones at **50 / 100 / 150 / 200 / 230** unique treasures permanently earn a shell wreath, pearl lamp, aurora mobile, tide fountain and celestial wall sculpture. Completing all **30 Moonpool Wonders** earns the glowing Moonpool aquarium with animated tiny fish. Rewards are retroactive for existing players and never cost money. Track progress in Collections; display or put away earned pieces in Decorate. Select Milestone corner for an aquarium view.

The cottage can grow from 18 to **96 display spaces**, with additional shelves, a glass cabinet, a sunroom and a deluxe gallery. Paint, wallpaper, floors, wood finishes, rugs, cushions, lamps, plants and ornaments remain owned permanently. The original seven completed collections award a journal seal and 500 sand dollars once each. Moonpool Wonders awards a glowing aquarium instead.

## Rarity and economy

`src/rarity.js` owns the base probabilities: Common 52.55%, Uncommon 21.40%, Rare 20%, Epic 5%, Legendary 1%, Mythic 0.05%. Roll the eligible tier first, then an item within it. Missing tiers redistribute proportionally; advanced discovery pools retain ordinary finds so exclusive Mythics cannot become common. There are no guaranteed Mythic drops or pity mechanics.

The seeded simulation assumes collecting all reachable sites each day, buying the specified equipment path, and selling a percentage of finds. Across 400 runs per scenario:

| Scenario                                | Mean days to detector | 10th–90th percentile |
| --------------------------------------- | --------------------: | -------------------: |
| Keep 25%; buy optional brush and sifter |                  25.4 |                23–28 |
| Keep 40%; buy optional brush and sifter |                  31.4 |                28–35 |
| Sell everything; direct equipment route |                  18.8 |                17–21 |

These are balance estimates, not a timer or a promise about any player's pace. Keeping more favorites or buying cottage decorations naturally changes the pace.

## Saves

The browser key remains **`trins-trinkets-save-v1`**, now with version 3 data and a versioned migration. Original money, inventory, discoveries, claims, tools, day, remaining tide, cottage settings and shelf coordinates are preserved. Expanded positions are not truncated to 18. Unknown IDs/fields are retained for future compatibility. Version 3 adds Moonpool access, remaining Moonpool sites, last visited biome, earned decorations and their display settings. Existing beach and cave tides are not regenerated during migration; an emptied Moonpool stays empty until sleep.

A copy of the pre-migration save is retained under `trins-trinkets-save-v1-backup`. Corrupt/newer saves pause writing instead of being overwritten. Storage errors show a persistent warning; **How to play → Export save** downloads the in-memory collection as JSON. Saves belong to the browser and origin; keep an export before clearing storage or switching browsers. The game never clears localStorage automatically.

## Visual inspection

Append **`?gallery=1`** to the game URL, or open **How to play → Developer model gallery**. Filter all 230 rotating models by collection, rarity and discovery status. Select one for enlarged inspection; drag the model to turn it manually. The gallery does not grant discoveries or inventory.

Developer preview URLs use disposable in-memory fixtures and **never read or write the player save**:

- `?preview=cottage`: 70 displayed pieces, every furniture upgrade, and sample wall artwork.
- `?preview=cave`: unlocked cave, lantern, pick and cave deposits.
- `?preview=moonpool`: unlocked colorful pools, plants, crystal gardens and ten discoveries.
- `?preview=milestones`: all six earned decorations and 70 displayed keepsakes.
- `?preview=entrance-locked` / `?preview=entrance-open`: the beach cave mouth before/after ownership.
- `?preview=passage-locked`: sealed Moonpool with missing discovery requirement.
- `?preview=passage-ready`: eligible Moonpool purchase, including the opening animation.
- `?preview=legacy`: migrated original tools and shelf coordinates, sample inventory and two fixed beach finds for interaction testing.

For hidden developer controls, type **PEARL** in the game (outside input fields). Biome playtesting offers access grants and navigation, plus the unsaved fixtures above. Granting access explicitly changes that local save; it preserves money, inventory, day and existing sites. Preview fixtures never touch the real save. Normal menus expose no access-grant or travel cheat.

## Project structure

- `catalog.js`, `legacy-catalog.js`, `lore.js`: permanent IDs, visual recipes, collection metadata and 230 handwritten stories.
- `artwork.js`, `treasures.js`: sculpted models, cached templates and normalized shelf footprints.
- `rarity.js`, `progression.js`, `inventory.js`, `tide.js`: weighted drops, purchases, selling/rewards and daily state.
- `moonpool-catalog.js`, `moonpool-art.js`: 30 stable IDs, authored lore and distinct sculpted models.
- `rewards.js`, `reward-art.js`: milestone tracking, permanent claims and physical cottage decorations.
- `locations.js`: biome metadata and passage traversal boundaries.
- `save.js`: protected loading, migration, validation, backup and saving.
- `world.js`, `cave.js`, `moonpool.js`, `passage.js`, `shelves.js`: beach/cottage/cave/Moonpool geometry, furniture and collision-free shelf slots.
- `museum.js`, `painting.js`: one shared preview renderer and the painting editor.
- `main.js`, `style.css`: gameplay orchestration, controls and cozy interface.
- `preview.js`: transient visual QA fixtures.

## GitHub Pages

The existing relative Vite base is retained. `.github/workflows/pages.yml` installs from the lockfile, tests, builds and deploys on pushes to `main` or a manual workflow dispatch. `check.yml` tests and builds pull requests. Pages must use **GitHub Actions** as its build source. The Three.js vendor chunk is cached separately from authored game code.
