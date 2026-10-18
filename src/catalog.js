export const CATALOG = [
  { id:'sand-dollar', name:'Sand Dollar', set:'Shells', type:'shell', rarity:'Common', method:'surface', value:7, color:'#efe5cc', weight:11 },
  { id:'pink-scallop', name:'Pink Scallop', set:'Shells', type:'scallop', rarity:'Common', method:'surface', value:6, color:'#f7aeb6', weight:13 },
  { id:'moon-shell', name:'Moon Shell', set:'Shells', type:'shell', rarity:'Common', method:'surface', value:9, color:'#e7c7a4', weight:10 },
  { id:'peach-cockle', name:'Peach Cockle', set:'Shells', type:'scallop', rarity:'Common', method:'surface', value:9, color:'#ffc5a5', weight:10 },
  { id:'sea-snail', name:'Sea Snail', set:'Shells', type:'conch', rarity:'Uncommon', method:'surface', value:15, color:'#b9aaef', weight:6 },
  { id:'striped-whelk', name:'Striped Whelk', set:'Shells', type:'conch', rarity:'Uncommon', method:'shovel', value:24, color:'#d8a17b', weight:8 },
  { id:'spiral-conch', name:'Spiral Conch', set:'Shells', type:'conch', rarity:'Rare', method:'shovel', value:44, color:'#ffb3a5', weight:3 },
  { id:'pearl-oyster', name:'Pearl Oyster', set:'Shells', type:'pearl', rarity:'Rare', method:'shovel', value:55, color:'#f4dbe8', weight:2 },
  { id:'clear-glass', name:'Frosted White Glass', set:'Sea Glass', type:'glass', rarity:'Common', method:'surface', value:6, color:'#e0ffef', weight:13 },
  { id:'green-glass', name:'Seafoam Glass', set:'Sea Glass', type:'glass', rarity:'Common', method:'surface', value:8, color:'#77ccb2', weight:13 },
  { id:'amber-glass', name:'Honey Glass', set:'Sea Glass', type:'glass', rarity:'Common', method:'surface', value:9, color:'#e8ac63', weight:10 },
  { id:'blue-glass', name:'Cornflower Glass', set:'Sea Glass', type:'glass', rarity:'Uncommon', method:'surface', value:16, color:'#83bdf2', weight:6 },
  { id:'lavender-glass', name:'Lavender Glass', set:'Sea Glass', type:'glass', rarity:'Uncommon', method:'shovel', value:28, color:'#b7a1f2', weight:6 },
  { id:'pink-glass', name:'Blush Pink Glass', set:'Sea Glass', type:'glass', rarity:'Rare', method:'shovel', value:49, color:'#ffa1cc', weight:3 },
  { id:'ruby-glass', name:'Ruby Red Glass', set:'Sea Glass', type:'glass', rarity:'Legendary', method:'detector', value:110, color:'#f25f76', weight:1 },
  { id:'beaded-bracelet', name:'Beaded Bracelet', set:'Jewelry', type:'bracelet', rarity:'Uncommon', method:'shovel', value:28, color:'#ffa8c3', weight:9 },
  { id:'shell-bracelet', name:'Shell Bracelet', set:'Jewelry', type:'bracelet', rarity:'Uncommon', method:'shovel', value:35, color:'#ffe1a5', weight:8 },
  { id:'pearl-bracelet', name:'Pearl Bracelet', set:'Jewelry', type:'bracelet', rarity:'Rare', method:'detector', value:66, color:'#f8dbef', weight:5 },
  { id:'heart-charm', name:'Little Heart Charm', set:'Jewelry', type:'charm', rarity:'Uncommon', method:'shovel', value:33, color:'#fbb7b5', weight:8 },
  { id:'golden-ring', name:'Golden Ring', set:'Jewelry', type:'ring', rarity:'Rare', method:'detector', value:76, color:'#f2c765', weight:5 },
  { id:'star-necklace', name:'Star Necklace', set:'Jewelry', type:'charm', rarity:'Rare', method:'detector', value:90, color:'#f4ca7e', weight:3 },
  { id:'moon-pendant', name:'Moon Pendant', set:'Jewelry', type:'charm', rarity:'Legendary', method:'detector', value:145, color:'#d4c8fb', weight:1 },
  { id:'old-coin', name:'Weathered Coin', set:'Lost Treasures', type:'coin', rarity:'Uncommon', method:'shovel', value:30, color:'#b9a16a', weight:10 },
  { id:'brass-key', name:'Tiny Brass Key', set:'Lost Treasures', type:'key', rarity:'Uncommon', method:'detector', value:44, color:'#d9b868', weight:9 },
  { id:'blue-button', name:'Porcelain Button', set:'Lost Treasures', type:'coin', rarity:'Uncommon', method:'shovel', value:23, color:'#8aadd7', weight:8 },
  { id:'old-locket', name:'Heart-shaped Locket', set:'Lost Treasures', type:'charm', rarity:'Rare', method:'detector', value:82, color:'#e2b985', weight:4 },
  { id:'silver-compass', name:'Miniature Compass', set:'Lost Treasures', type:'coin', rarity:'Rare', method:'detector', value:98, color:'#c0dce6', weight:3 },
  { id:'message-bottle', name:'Message in a Bottle', set:'Lost Treasures', type:'bottle', rarity:'Legendary', method:'detector', value:165, color:'#a0cfbd', weight:1 },
  { id:'starfish', name:'Rose Starfish', set:'Ocean Wonders', type:'starfish', rarity:'Common', method:'surface', value:13, color:'#f5a2a3', weight:7 },
  { id:'fossil', name:'Tiny Spiral Fossil', set:'Ocean Wonders', type:'fossil', rarity:'Rare', method:'shovel', value:62, color:'#d3c19b', weight:3 },
  { id:'shark-tooth', name:'Shark Tooth', set:'Ocean Wonders', type:'tooth', rarity:'Uncommon', method:'shovel', value:38, color:'#ece0c9', weight:8 },
  { id:'perfect-pearl', name:'Perfect Pearl', set:'Ocean Wonders', type:'pearl', rarity:'Legendary', method:'detector', value:190, color:'#fff1e6', weight:1 }
];

export const SETS = ['Shells','Sea Glass','Jewelry','Lost Treasures','Ocean Wonders'];
export const ITEMS = Object.fromEntries(CATALOG.map(item => [item.id, item]));
export const UPGRADES = [
  { id:'shovel', name:'Pastel Shovel', cost:65, detail:'Unearth bracelets, fossils, and treasures beneath little sand mounds.' },
  { id:'detector', name:'Metal Detector', cost:220, detail:'Press F to scan the beach for hidden jewelry and forgotten valuables.' }
];
export const SHOP_COLORS = {
  cream: '#fff0df',
  blush: '#f7d7d9',
  blue: '#d0e9ef',
  sage: '#dbe8d4',
  lavender: '#e8dbf0'
};
export const WOODS = {
  maple: '#cda579',
  white: '#eee8dc',
  walnut: '#81624e'
};
export function pickRandom(method) {
  const choices = CATALOG.filter(i => i.method === method);
  const total = choices.reduce((sum,i) => sum + i.weight,0);
  let roll = Math.random()*total;
  return choices.find(i => (roll -= i.weight) <= 0) || choices[0];
}
