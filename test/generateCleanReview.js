const fs = require('fs');
const results = JSON.parse(fs.readFileSync(__dirname + '/allItemsComparison.json', 'utf8'));

// All set items to exclude entirely
const setPatterns = [
  // Tier sets
  /^Crown of Might/, /^Helm of Might/, /^Bracers of Might/, /^Gloves of Might/, /^Girdle of Might/, /^Sabatons of Might/, /^Belt of Might/, /^Legplates of Might/, /^Chestplate of Might/,
  /^Crown of Wrath/, /^Helm of Wrath/, /^Pauldrons of Wrath/, /^Bindings of Wrath/, /^Gloves of Wrath/, /^Girdle of Wrath/, /^Leggings of Wrath/, /^Sabatons of Wrath/, /^Chestplate of Wrath/,
  /^Dreadnaught/, // All Dreadnaught (T3)

  // Dungeon sets
  /of Valor$/, /^Helm of Valor/, /^Belt of Valor/, /^Boots of Valor/, /^Bracers of Valor/, /^Breastplate of Valor/, /^Gauntlets of Valor/, /^Legplates of Valor/, /^Spaulders of Valor/,
  /of Heroism$/, /^Helm of Heroism/, /^Belt of Heroism/, /^Boots of Heroism/, /^Bracers of Heroism/, /^Breastplate of Heroism/, /^Gauntlets of Heroism/, /^Legplates of Heroism/, /^Spaulders of Heroism/,

  // PvP sets
  /^R7 /, /^R8 /, /^R10 /, /^R12 /, /^R13 /, /^R14 /,
  /^Bloody Gladiator/,
  /^Savage Gladiator/,

  // Crafted/world sets
  /^Black Dragonscale/,
  /^Devilsaur/,
  /^Cadaverous/,
  /^Bloodmail/,
  /^Stormshroud/,
  /^Abyssal Plate/,
  /^Conqueror's/,
  /^Arathi Plate/,
  /^Polar /, /^Icy Scale/, /^Icebane/,
  /Brotherhood/,

  // Turtle WoW sets
  /^Choker of the Brotherhood/, /^Pauldrons of the Brotherhood/, /^Chestplate of the Brotherhood/, /^Bindings of the Brotherhood/, /^Gloves of the Brotherhood/, /^Girdle of the Brotherhood/, /^Leggings of the Brotherhood/, /^Sabatons of the Brotherhood/, /^Ring of the Brotherhood/,
  /^Helmet of the Brotherhood/,
];

function isSetItem(name) {
  for (var i = 0; i < setPatterns.length; i++) {
    if (setPatterns[i].test(name)) return true;
  }
  return false;
}

// Filter to non-set, non-custom items
const filtered = results.filter(function(item) {
  if (item.slot === 'custom') return false;
  if (isSetItem(item.name)) return false;
  return true;
});

// Group by slot
const bySlot = {};
filtered.forEach(function(item) {
  if (!bySlot[item.slot]) bySlot[item.slot] = [];
  bySlot[item.slot].push(item);
});

var output = [];
output.push('================================================================================');
output.push('              WARRIOR SIM ITEM COMPARISON - NON-SET ITEMS ONLY');
output.push('                   Sim Values vs database.turtlecraft.gg');
output.push('================================================================================');
output.push('');
output.push('Legend:');
output.push('  sim = value in WarriorSim');
output.push('  db  = value in database.turtlecraft.gg');
output.push('  -   = no value / 0');
output.push('');
output.push('Excluded: All tier sets, dungeon sets, PvP sets, crafted sets');
output.push('          Feral AP items show AP in DB but doesn\'t apply to Warriors');
output.push('');
output.push('Total non-set items: ' + filtered.length);
output.push('================================================================================');
output.push('');

function fmt(val) {
  return val ? String(val) : '-';
}

var slots = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'ranged', 'mainhand', 'offhand', 'twohand'];

slots.forEach(function(slot) {
  if (!bySlot[slot] || bySlot[slot].length === 0) return;

  output.push('=== ' + slot.toUpperCase() + ' (' + bySlot[slot].length + ' items) ===');
  output.push('');

  bySlot[slot].forEach(function(item) {
    output.push(item.name + ' (ID: ' + item.id + ')');
    output.push('  STR: sim=' + fmt(item.sim.str) + ' db=' + fmt(item.db.str) +
                ' | AGI: sim=' + fmt(item.sim.agi) + ' db=' + fmt(item.db.agi) +
                ' | STA: sim=' + fmt(item.sim.sta) + ' db=' + fmt(item.db.sta));
    output.push('  AC: sim=' + fmt(item.sim.ac) + ' db=' + fmt(item.db.ac) +
                ' | AP: sim=' + fmt(item.sim.ap) + ' db=' + fmt(item.db.ap) +
                ' | HIT: sim=' + fmt(item.sim.hit) + ' db=' + fmt(item.db.hit));
    output.push('  CRIT: sim=' + fmt(item.sim.crit) + ' db=' + fmt(item.db.crit) +
                ' | ARP: sim=' + fmt(item.sim.arp) + ' db=' + fmt(item.db.arp) +
                ' | HASTE: sim=' + fmt(item.sim.haste) + ' db=' + fmt(item.db.haste));
    output.push('');
  });
});

fs.writeFileSync(__dirname + '/ITEM_REVIEW_NONSET.txt', output.join('\n'));
console.log('Saved to test/ITEM_REVIEW_NONSET.txt');
console.log('Total non-set items: ' + filtered.length);
