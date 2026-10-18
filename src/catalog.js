import { CATALOG as ORIGINAL } from './legacy-catalog.js';
import { rollTreasure } from './rarity.js';
import { LORE } from './lore.js';
import { MOONPOOL_CATALOG } from './moonpool-catalog.js';
export const SETS = [
  'Shells',
  'Sea Glass',
  'Jewelry',
  'Ocean Wonders',
  'Lost Treasures',
  'Cave Crystals',
  'Cave Relics',
  'Moonpool Wonders',
];
export const COLLECTION_NAMES = [
  'Seashells & Coastal Shells',
  'Sea Glass & Washed Gems',
  'Jewelry & Charms',
  'Ocean Wonders',
  'Lost Treasures & Keepsakes',
  'Cave Crystals & Minerals',
  'Cave Fossils & Relics',
  'Moonpool Wonders',
];
export const COLLECTION_COUNTS = [40, 26, 34, 28, 24, 28, 20, 30];
const R = {
  C: 'Common',
  U: 'Uncommon',
  R: 'Rare',
  E: 'Epic',
  L: 'Legendary',
  M: 'Mythic',
};
// Authored silhouettes, palettes, discovery tools, motifs and structural variants.
const rows = [
  `rose-abalone|Rose Abalone|abalone|e6afc4|R|brush|pearl|7
buttercup-limpet|Buttercup Limpet|limpet|f1cf8d|C|surface|rays|12
angel-wing|Angel Wing|wing|f4e5d7|U|brush|feather|17
apricot-auger|Apricot Auger|auger|e8b58c|U|shovel|ribs|9
violet-sundial|Violet Sundial|nautilus|bbade0|R|surface|spiral|11
little-cowrie|Little Cowrie|cowrie|edc6a6|C|surface|spots|8
lace-murex|Lace Murex|murex|f0d5cd|E|brush|spines|9
strawberry-top-shell|Strawberry Top Shell|topshell|d994a9|U|surface|stripes|6
pelican-foot-shell|Pelican Foot Shell|wing|d9c8ab|R|trowel|fingers|5
ivory-tusk-shell|Ivory Tusk Shell|tusk|f6e8c8|C|shovel|flutes|7
coral-tulip-shell|Coral Tulip Shell|conch|e58d95|U|shovel|crown|7
blue-mussel|Blue Mussel|mussel|727dba|C|surface|ridges|11
sunrise-clam|Sunrise Clam|clam|efb6a2|C|surface|rays|14
ribbon-whelk|Ribbon Whelk|whelk|d6b5db|R|scoop|ribbon|12
paper-nautilus|Paper Nautilus|nautilus|fff0dd|E|brush|sails|21
tiger-cowrie|Tiger Cowrie|cowrie|ddb175|R|scoop|spots|19
tiny-wentletrap|Tiny Wentletrap|auger|f4e7d9|U|sifter|ladder|16
peacock-abalone|Peacock Abalone|abalone|7cbeb8|E|trowel|pearl|13
snowflake-limpet|Snowflake Limpet|limpet|d1dbe4|U|surface|snow|8
pink-razor-clam|Pink Razor Clam|razor|dfa5b4|U|shovel|ribs|7
honey-olive-shell|Honey Olive Shell|olive|d8a467|C|surface|zigzag|9
lily-scallop|Lily Scallop|scallop|efe3bc|R|scoop|petals|18
queen-conch|Queen Conch|conch|efbac4|L|trowel|crown|13
silver-moon-snail|Silver Moon Snail|topshell|c3cfdf|E|brush|spiral|10
glasswing-shell|Glasswing Shell|wing|bddfdd|E|brush|feather|23
rosebud-cowrie|Rosebud Cowrie|cowrie|e9a3b0|U|surface|buds|11
wishing-shell|Wishing Shell|nautilus|e3c6ec|L|scoop|stars|17
golden-triton|Golden Triton|whelk|e8c06c|L|trowel|spines|15
fairy-slipper-shell|Fairy Slipper Shell|slipper|dcb6d5|R|brush|pearl|6
seafoam-turret|Seafoam Turret|auger|a5c9be|R|scoop|ladder|12
aurora-empress-shell|Aurora Empress Shell|murex|efb8d9|M|trowel|halo|16
mermaid-crown|Mermaid Crown|murex|b5dacf|L|scoop|crown|12`,
  `teardrop-glass|Teardrop Glass|glass-drop|b6d3e9|C|surface|frost|5
seafoam-heart|Seafoam Heart|glass-heart|93cfbd|U|surface|bubbles|7
lilac-bottle-lip|Lilac Bottle Lip|glass-ring|b8a4d0|U|sifter|ripple|9
golden-honeycomb-glass|Golden Honeycomb Glass|glass-honey|dcb572|R|shovel|cells|7
tidal-marble|Tidal Marble|marble|8bb9cd|C|sifter|ribbon|3
moonstone-pebble|Moonstone Pebble|cabochon|d8daeb|R|surface|moon|5
cherry-blossom-glass|Cherry Blossom Glass|glass-flower|e6a7bb|R|sifter|petals|5
ocean-bottle-base|Ocean Bottle Base|glass-ring|77aeb7|C|surface|seal|12
frosted-sail|Frosted Sail|glass-sail|d3e5df|C|surface|frost|3
blue-lace-agate|Blue Lace Agate|agate|9abedb|U|shovel|bands|7
carnelian-drop|Carnelian Drop|glass-drop|dc8f6a|U|shovel|bands|8
opal-wishstone|Opal Wishstone|cabochon|c5d9da|E|brush|fire|9
mermaid-tear|Mermaid Tear|glass-drop|7bbac8|E|trowel|bubbles|11
rose-quartz-heart|Rose Quartz Heart|glass-heart|e6b5c9|R|brush|veins|9
sea-witch-seal|Sea Witch Seal|glass-honey|9175ae|E|probe|stars|6
rainbow-swirl-marble|Rainbow Swirl Marble|marble|e7b4cf|E|sifter|ribbon|5
tiny-emerald-bottle|Tiny Emerald Bottle|glass-vial|78b59c|R|sifter|bubbles|4
sunken-sapphire|Sunken Sapphire|cut-gem|6b9bc9|L|detector|cushion|8
starlight-opal|Starlight Opal|cut-gem|d5c4e9|M|trowel|star|12`,
  `daisy-chain-bracelet|Daisy Chain Bracelet|bracelet|eed28e|U|sifter|daisy|12
tidepool-charm-bracelet|Tidepool Charm Bracelet|bracelet|86c4bb|R|probe|shell|18
ribbon-friendship-bracelet|Ribbon Friendship Bracelet|braid|dfa2bc|C|surface|ribbon|3
coral-rosary-bracelet|Coral Rosary Bracelet|bracelet|d8968e|R|shovel|coral|21
moonlit-silver-bangle|Moonlit Silver Bangle|bangle|c4cddd|E|detector|moon|8
sunbeam-cuff|Sunbeam Cuff|cuff|e2b66b|R|probe|sun|11
sea-lily-ring|Sea Lily Ring|ring|b3cfae|R|probe|flower|5
sapphire-promise-ring|Sapphire Promise Ring|ring|6c9dbd|E|detector|oval|8
rose-signet|Rose Signet|signet|e1b2b1|R|probe|rose|6
twisted-silver-ring|Twisted Silver Ring|twist-ring|b9c8d8|U|probe|braid|3
pearl-daisy-earrings|Pearl Daisy Earrings|earrings|f0dfc7|R|sifter|daisy|6
seahorse-brooch|Seahorse Brooch|brooch|93c6bc|E|detector|seahorse|7
tiny-anchor-charm|Tiny Anchor Charm|anchor|b6cbd7|U|probe|rope|4
wishbone-charm|Wishbone Charm|wishbone|e0bd7d|U|sifter|pearl|3
butterfly-pendant|Butterfly Pendant|butterfly|baa5d5|R|probe|filigree|6
rose-locket-necklace|Rose Locket Necklace|locket|dca9b7|E|detector|rose|8
ocean-drop-necklace|Ocean Drop Necklace|necklace|84bdcb|R|probe|drop|9
sunflower-necklace|Sunflower Necklace|necklace|e5bf73|E|detector|sun|12
constellation-necklace|Constellation Necklace|necklace|a3a9d3|L|coil|stars|7
enchanted-pearl-tiara|Enchanted Pearl Tiara|tiara|d7d6e7|L|detector|pearl|9
mermaid-hair-comb|Mermaid Hair Comb|comb|98c8bd|R|probe|shell|11
enamel-daisy-pin|Enamel Daisy Pin|brooch|f0d98e|U|sifter|daisy|8
honeybee-pendant|Honeybee Pendant|bee|e5bd6a|R|probe|wings|5
bow-ribbon-brooch|Bow Ribbon Brooch|bow|d99eb5|U|shovel|pearl|4
ruby-heart-ring|Ruby Heart Ring|ring|c57591|L|coil|heart|10
empress-pearl-collar|Empress Pearl Collar|necklace|e9d8b4|L|professional|pearl|17
eternal-tide-diadem|Eternal Tide Diadem|tiara|e9b8d8|M|professional|stars|13`,
  `coral-garden|Coral Garden|coral|eaa3a9|U|surface|branches|7
sea-fan|Sea Fan|fan|c695c2|R|brush|lace|13
sponge-cup|Sponge Cup|sponge|e2bd86|C|surface|pores|11
urchin-lantern|Urchin Lantern|urchin|b3a4c9|U|brush|ribs|15
tiny-seahorse|Tiny Seahorse|seahorse|e1bd8e|R|brush|crown|9
coral-heart|Coral Heart|coral|dc949f|R|shovel|heart|9
pearl-nest|Pearl Nest|nest|e8d4bf|E|brush|pearl|5
sea-angel|Sea Angel|angel|bfd8e4|E|scoop|wings|7
tidepool-anemone|Tidepool Anemone|anemone|b4b7d5|U|surface|petals|18
nautilus-chamber|Nautilus Chamber|nautilus|dbba9d|R|trowel|chambers|15
lace-urchin|Lace Urchin|urchin|d6cbbb|R|brush|lace|19
coral-antlers|Coral Antlers|coral|e2ac92|U|shovel|branches|11
driftwood-nest|Driftwood Nest|nest|b5a087|C|surface|egg|7
ocean-lotus|Ocean Lotus|anemone|d3bbdc|E|scoop|petals|12
sea-bunny-keepsake|Sea Bunny Keepsake|bunny|e3dbe5|E|brush|ears|5
blue-coral-tree|Blue Coral Tree|coral|8cb5ce|R|scoop|tree|15
tiny-turtle-shell|Tiny Turtle Shell|turtle|94b8a8|U|surface|tiles|7
pink-sea-fan|Pink Sea Fan|fan|e4acc4|R|brush|lace|19
moon-jelly-keepsake|Moon Jelly Keepsake|jelly|c0d2e6|E|scoop|tentacles|8
golden-coral-branch|Golden Coral Branch|coral|dab770|L|trowel|branches|13
pearl-constellation|Pearl Constellation|nest|eadbca|L|detector|stars|9
sleeping-octopus-keepsake|Sleeping Octopus Keepsake|octopus|c5a8cc|E|scoop|arms|8
rainbow-sea-angel|Rainbow Sea Angel|angel|d8b6de|L|trowel|wings|11
heart-of-the-ocean|Heart of the Ocean|anemone|d2b6e2|M|scoop|pearl|23`,
  `seaside-music-box|Seaside Music Box|musicbox|c2abc9|E|detector|flower|8
sailor-jewelry-case|Sailor Jewelry Case|case|9cb7c9|R|probe|anchor|6
little-tea-cup|Little Tea Cup|teacup|e9c4cf|U|shovel|daisy|5
porcelain-thimble|Porcelain Thimble|thimble|c2d4dd|C|surface|dots|14
vintage-telescope|Vintage Telescope|telescope|ceac78|R|probe|rings|4
pocket-sundial|Pocket Sundial|compass|d7ba83|E|detector|sun|12
silver-sewing-scissors|Silver Sewing Scissors|scissors|bccad4|U|probe|filigree|5
rose-perfume-bottle|Rose Perfume Bottle|perfume|d9abc1|R|probe|rose|7
tiny-lighthouse|Tiny Lighthouse|lighthouse|dfc5b0|U|shovel|stripes|5
love-letter-bottle|Love Letter Bottle|bottle|a9c7d2|R|shovel|heart|6
little-wishing-bell|Little Wishing Bell|bell|dbc18d|U|probe|ribbon|7
captain-seal-stamp|Captain Seal Stamp|stamp|b79980|R|probe|anchor|8
swan-ring-holder|Swan Ring Holder|swan|efe1d3|E|detector|wings|9
pressed-flower-locket|Pressed Flower Locket|locket|dfbd91|R|probe|daisy|5
ornate-garden-key|Ornate Garden Key|key|c1ba98|R|probe|leaf|11
clockwork-nightingale|Clockwork Nightingale|bird|c5b3a1|L|coil|wings|9
royal-cameo|Royal Cameo|cameo|e3c2c6|L|detector|rose|7
first-love-music-box|First Love Music Box|musicbox|edc3d6|M|professional|swan|13`,
  `amethyst-cathedral|Amethyst Cathedral|geode|a68bcb|E|pick|points|13
rose-quartz-bouquet|Rose Quartz Bouquet|cluster|e3afc4|R|cave|flower|7
celestite-grotto|Celestite Grotto|geode|a4c6df|R|cave|points|9
honey-calcite|Honey Calcite|calcite|dfbd76|C|cave|steps|5
fluorite-staircase|Fluorite Staircase|fluorite|9fc8b8|U|pick|steps|6
aquamarine-needles|Aquamarine Needles|needles|92cbd7|R|cave|needles|11
selenite-moon|Selenite Moon|crescent|e7e1cc|U|lantern|moon|7
pyrite-sun|Pyrite Sun|pyrite|c3ac6b|U|pick|cubes|9
malachite-slice|Malachite Slice|agate|79a68c|C|cave|bands|11
labradorite-wing|Labradorite Wing| mineral-wing|8ca7bd|E|lantern|feather|13
rhodochrosite-rose|Rhodochrosite Rose|rosette|da9fab|R|pick|petals|12
aragonite-starburst|Aragonite Starburst|starburst|e3c6a5|U|cave|needles|17
clear-quartz-garden|Clear Quartz Garden|cluster|d6e7e2|C|cave|points|5
smoky-quartz-tower|Smoky Quartz Tower|obelisk|aa9ba0|U|pick|prism|6
peach-stilbite|Peach Stilbite|rosette|e7b59f|C|cave|petals|7
azurite-velvet|Azurite Velvet|botryoidal|7e98c2|R|lantern|grapes|13
spirit-quartz|Spirit Quartz|cluster|bdafd6|E|pick|points|19
tourmaline-watermelon|Tourmaline Watermelon|tourmaline|c6a7ba|E|pick|core|7
desert-rose|Desert Rose|rosette|cbb49a|U|cave|sand|17
chalcedony-cloud|Chalcedony Cloud|botryoidal|b9cfd5|C|cave|cloud|7
bismuth-rainbow|Bismuth Rainbow|bismuth|c0a3cd|E|pick|steps|9
emerald-matrix|Emerald Matrix|matrix|80b69e|L|pick|prism|5
sapphire-cavern-bloom|Sapphire Cavern Bloom|starburst|91a2d0|L|lantern|needles|23
opal-fire-geode|Opal Fire Geode|geode|dcc6dc|L|pick|fire|17
citrine-sunrise|Citrine Sunrise|cluster|eac37b|R|lantern|points|11
moon-milk-pearl|Moon Milk Pearl|botryoidal|eee1db|R|lantern|pearl|17
starlit-heart-geode|Starlit Heart Geode|heart-geode|d8b1df|M|pick|stars|21
aurora-crystal-crown|Aurora Crystal Crown|cluster|b7d9ce|L|pick|crown|23`,
  `fern-impression|Fern Impression|fern|a8b19a|C|cave|frond|11
trilobite-curl|Trilobite Curl|trilobite|bba995|U|cave|segments|13
opal-ammonite|Opal Ammonite|ammonite|c0b6d0|E|pick|chambers|17
tiny-fossil-fish|Tiny Fossil Fish|fish-fossil|c9b998|C|cave|bones|9
crinoid-lily|Crinoid Lily|crinoid|d6bb9c|R|brush|petals|7
ancient-coral-lace|Ancient Coral Lace|fossil-coral|bea9ac|U|cave|cells|13
amber-dragonfly|Amber Dragonfly|amber|d8a968|E|lantern|dragonfly|7
petrified-wood-heart|Petrified Wood Heart|wood-heart|bc9b88|R|pick|rings|11
star-stone|Star Stone|echinoid|d6c8ac|C|cave|star|5
nautilus-opal-relic|Nautilus Opal Relic|ammonite|a5c9c5|L|pick|chambers|23
cave-pearl-rosary|Cave Pearl Rosary|relic-necklace|d8cfc0|R|lantern|pearl|13
ancient-bronze-lantern|Ancient Bronze Lantern|relic-lantern|b6a27d|E|lantern|flame|7
carved-moon-tablet|Carved Moon Tablet|tablet|aaaac0|U|cave|moon|9
fossil-feather|Fossil Feather|fern|c0b0a0|R|brush|feather|17
tiny-mammoth-tusk|Tiny Mammoth Tusk|tusk|d4bea0|U|pick|rings|11
sunken-crown-relic|Sunken Crown Relic|relic-crown|c1ac77|L|pick|stones|9
crystal-scarab|Crystal Scarab|scarab|9bb5bd|E|pick|wings|11
sleeping-dragon-egg|Sleeping Dragon Egg|dragon-egg|b8aacb|L|pick|scales|17
timekeeper-astrolabe|Timekeeper Astrolabe|astrolabe|cdb380|L|lantern|stars|7
memory-of-the-first-tide|Memory of the First Tide|astrolabe|ddb7db|M|pick|halo|13`,
];
const ranges = {
  Common: [10, 22],
  Uncommon: [25, 55],
  Rare: [65, 130],
  Epic: [160, 360],
  Legendary: [500, 1100],
  Mythic: [2500, 6000],
};
const originalTypes = {
  'sand-dollar': 'sand-dollar',
  'moon-shell': 'nautilus',
  'sea-snail': 'topshell',
  'striped-whelk': 'whelk',
  'blue-button': 'button',
  'silver-compass': 'compass',
  'star-necklace': 'necklace',
  'moon-pendant': 'necklace',
  'old-locket': 'locket',
  'perfect-pearl': 'pearl-nest',
  'clear-glass': 'glass-sail',
  'green-glass': 'glass-drop',
  'amber-glass': 'glass-honey',
  'blue-glass': 'cabochon',
  'lavender-glass': 'glass-ring',
  'pink-glass': 'glass-heart',
  'ruby-glass': 'cut-gem',
};
function finish(item, index) {
  const [lo, hi] = ranges[item.rarity];
  return {
    ...item,
    collection: item.set,
    environment: item.set.startsWith('Cave') ? 'cave' : 'beach',
    value: Math.round(lo + ((hi - lo) * (index % 7)) / 7),
    weight: 1,
    description: LORE[item.id],
  };
}
export const CATALOG = ORIGINAL.map((i, n) =>
  finish(
    {
      ...i,
      type: originalTypes[i.id] || i.type,
      visual: {
        variant: n + 3,
        motif: ['ridges', 'pearl', 'ribbon', 'petals', 'stars', 'braid'][n % 6],
        accent: ['#fff0d4', '#e9b2c5', '#a1cbbf'][n % 3],
        profile: 1 + (n % 4) * 0.12,
      },
    },
    n,
  ),
);
for (let s = 0; s < rows.length; s++)
  for (const line of rows[s].split('\n')) {
    const [id, name, type, color, r, method, motif, variant] = line.split('|');
    CATALOG.push(
      finish(
        {
          id,
          name,
          set: SETS[s],
          type: type.trim(),
          color: '#' + color,
          rarity: R[r],
          method,
          visual: {
            variant: Number(variant),
            motif,
            accent: ['#fff1d6', '#eac1d5', '#b5d7cd'][Number(variant) % 3],
            profile: 0.8 + (Number(variant) % 5) * 0.13,
          },
        },
        CATALOG.length,
      ),
    );
  }
CATALOG.push(...MOONPOOL_CATALOG);
export const ITEMS = Object.fromEntries(CATALOG.map((i) => [i.id, i]));
export { UPGRADES, SHOP_COLORS, WOODS } from './progression.js';
export const pickRandom = (
  method,
  environment = 'beach',
  equipment = {},
  rng = Math.random,
) => rollTreasure(CATALOG, { method, environment, equipment }, rng);
