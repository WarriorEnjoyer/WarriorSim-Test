const fs = require('fs');
const results = JSON.parse(fs.readFileSync(__dirname + '/itemStatResults.json', 'utf8'));

// Known set items to exclude (by name patterns)
const setPatterns = [
  /^Crown of Might/, /^Helm of Might/, /^Bracers of Might/, /^Gloves of Might/, /^Girdle of Might/, /^Sabatons of Might/, /^Belt of Might/, /^Legplates of Might/, /^Chestplate of Might/,
  /^Crown of Wrath/, /^Helm of Wrath/, /^Pauldrons of Wrath/, /^Bindings of Wrath/, /^Gloves of Wrath/, /^Girdle of Wrath/, /^Leggings of Wrath/, /^Sabatons of Wrath/, /^Chestplate of Wrath/,
  /^Dreadnaught/, // All Dreadnaught pieces
  /of Valor$/, /^Helm of Valor/, /^Belt of Valor/, /^Boots of Valor/, /^Bracers of Valor/, /^Breastplate of Valor/, /^Gauntlets of Valor/, /^Legplates of Valor/, /^Spaulders of Valor/,
  /of Heroism$/, /^Helm of Heroism/, /^Belt of Heroism/, /^Boots of Heroism/, /^Bracers of Heroism/, /^Breastplate of Heroism/, /^Gauntlets of Heroism/, /^Legplates of Heroism/, /^Spaulders of Heroism/,
  /^R7 /, /^R8 /, /^R10 /, /^R12 /, /^R13 /, /^R14 /, // PvP ranks
  /^Bloody Gladiator/, // Gladiator set
  /^Black Dragonscale/, // Black Dragonscale set
  /^Devilsaur/, // Devilsaur set
  /^Cadaverous/, // Cadaverous set
  /^Bloodmail/, // Bloodmail set
  /^Stormshroud/, // Stormshroud set
  /^Abyssal Plate/, // Abyssal set
  /^Conqueror's/, // AQ set
  /^Arathi Plate/, // Arathi set
  /^Polar /, /^Icy Scale/, /^Icebane/, // Frost resist sets
  /Brotherhood/, // Brotherhood set
  /^Savage Gladiator/, // Savage Gladiator set
];

function isSetItem(name) {
  for (var i = 0; i < setPatterns.length; i++) {
    if (setPatterns[i].test(name)) return true;
  }
  return false;
}

// Filter discrepancies
const nonSetDiscrepancies = results.discrepancies.filter(function(item) {
  return item.slot !== 'custom' && !isSetItem(item.name);
});

console.log('=== NON-SET ITEM DISCREPANCIES ===\n');
console.log('Total: ' + nonSetDiscrepancies.length + ' items\n');

// Group by slot
const bySlot = {};
nonSetDiscrepancies.forEach(function(item) {
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
