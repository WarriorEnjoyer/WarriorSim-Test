const fs = require('fs');
const results = JSON.parse(fs.readFileSync(__dirname + '/itemStatResults.json', 'utf8'));

// Known set items to exclude
const setPatterns = [
  /^Crown of Might/, /^Helm of Might/, /^Bracers of Might/, /^Gloves of Might/, /^Girdle of Might/, /^Sabatons of Might/, /^Belt of Might/, /^Legplates of Might/, /^Chestplate of Might/,
  /^Crown of Wrath/, /^Helm of Wrath/, /^Pauldrons of Wrath/, /^Bindings of Wrath/, /^Gloves of Wrath/, /^Girdle of Wrath/, /^Leggings of Wrath/, /^Sabatons of Wrath/, /^Chestplate of Wrath/,
  /^Dreadnaught/,
  /of Valor$/, /^Helm of Valor/, /^Belt of Valor/, /^Boots of Valor/, /^Bracers of Valor/, /^Breastplate of Valor/, /^Gauntlets of Valor/, /^Legplates of Valor/, /^Spaulders of Valor/,
  /of Heroism$/, /^Helm of Heroism/, /^Belt of Heroism/, /^Boots of Heroism/, /^Bracers of Heroism/, /^Breastplate of Heroism/, /^Gauntlets of Heroism/, /^Legplates of Heroism/, /^Spaulders of Heroism/,
  /^R7 /, /^R8 /, /^R10 /, /^R12 /, /^R13 /, /^R14 /,
  /^Bloody Gladiator/,
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
  /^Savage Gladiator/,
];

// Items known to have Feral AP (not regular AP) - exclude AP discrepancies for these
const feralAPItems = [
  'Might of Menethil',
  'Barb of the Sand Reaver',
  'Herald of Woe',
  'Draconic Maul',
  'The Eye of Nerub',
  'Blackfury',
  'Gavel of Aqir Superiority',
  'Halberd of the Bronze Defender',
  'Cryptkeeper\'s Pike',
  'Boneshatter Maul',
  'Doomulus Prime',
  'Tigule\'s Harpoon',
  'Bonecrusher',
  'Crystal Spiked Maul',
  'Ice Barbed Spear',
  'Huntsman\'s Harpoon',
  'Blessed Qiraji War Hammer',
  'Hammer of Bestial Fury',
  'Dal\'Rend\'s Sacred Charge',
  'Dal\'Rend\'s Tribal Guardian',
  'Finkle\'s Skinner',
  'Raka\'shishi, Spear of the Adrift Hunt',
  'Blade of the Blademaster',
  'Forgotten Raven\'s Mallet',
];

function isSetItem(name) {
  for (var i = 0; i < setPatterns.length; i++) {
    if (setPatterns[i].test(name)) return true;
  }
  return false;
}

function isFeralAPItem(name) {
  for (var i = 0; i < feralAPItems.length; i++) {
    if (name.indexOf(feralAPItems[i]) !== -1) return true;
  }
  return false;
}

// Filter discrepancies
const filtered = [];

results.discrepancies.forEach(function(item) {
  if (item.slot === 'custom') return;
  if (isSetItem(item.name)) return;

  // Filter out AP discrepancies for feral items
  var dominated = isFeralAPItem(item.name);
  var validDiffs = item.differences.filter(function(d) {
    if (dominated && d.stat === 'ap' && d.sim === 0) return false;
    return true;
  });

  if (validDiffs.length > 0) {
    filtered.push({
      name: item.name,
      id: item.id,
      slot: item.slot,
      differences: validDiffs
    });
  }
});

console.log('=== NON-SET ITEM DISCREPANCIES (excluding Feral AP) ===\n');
console.log('Total: ' + filtered.length + ' items\n');

// Group by slot
const bySlot = {};
filtered.forEach(function(item) {
  if (!bySlot[item.slot]) bySlot[item.slot] = [];
  bySlot[item.slot].push(item);
});

var slots = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'ranged', 'mainhand', 'offhand', 'twohand'];

slots.forEach(function(slot) {
  if (!bySlot[slot] || bySlot[slot].length === 0) return;

  console.log('--- ' + slot.toUpperCase() + ' ---\n');

  bySlot[slot].forEach(function(item) {
    console.log(item.name + ' (ID: ' + item.id + ')');
    item.differences.forEach(function(d) {
      console.log('  ' + d.stat + ': sim=' + d.sim + ' db=' + d.db);
    });
    console.log('');
  });
});
