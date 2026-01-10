const fs = require('fs');
const results = JSON.parse(fs.readFileSync(__dirname + '/allItemsV2.json', 'utf8'));

function formatStat(val) {
  return val ? String(val) : '-';
}

function hasDifference(item) {
  const stats = ['str', 'agi', 'sta', 'ac', 'ap', 'crit', 'hit', 'arp', 'haste'];
  for (var i = 0; i < stats.length; i++) {
    var stat = stats[i];
    if (item.sim[stat] !== item.db[stat]) return true;
  }
  return false;
}

// Filter to only items with differences
const withDiffs = results.filter(hasDifference);

// Group by slot
var bySlot = {};
withDiffs.forEach(function(item) {
  if (!bySlot[item.slot]) bySlot[item.slot] = [];
  bySlot[item.slot].push(item);
});

var output = [];
output.push('================================================================================');
output.push('           WARRIOR SIM - ITEMS WITH DIFFERENCES (NO SET BONUS STATS)');
output.push('                   Sim Values vs database.turtlecraft.gg');
output.push('================================================================================');
output.push('');
output.push('Total items with differences: ' + withDiffs.length);
output.push('');

var slots = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'ranged', 'mainhand', 'offhand', 'twohand'];

slots.forEach(function(slot) {
  if (!bySlot[slot] || bySlot[slot].length === 0) return;

  output.push('=== ' + slot.toUpperCase() + ' (' + bySlot[slot].length + ' items) ===');
  output.push('');

  bySlot[slot].forEach(function(item) {
    output.push(item.name + ' (ID: ' + item.id + ')');
    output.push('  STR: sim=' + formatStat(item.sim.str) + ' db=' + formatStat(item.db.str) +
                ' | AGI: sim=' + formatStat(item.sim.agi) + ' db=' + formatStat(item.db.agi) +
                ' | STA: sim=' + formatStat(item.sim.sta) + ' db=' + formatStat(item.db.sta));
    output.push('  AC: sim=' + formatStat(item.sim.ac) + ' db=' + formatStat(item.db.ac) +
                ' | AP: sim=' + formatStat(item.sim.ap) + ' db=' + formatStat(item.db.ap) +
                ' | HIT: sim=' + formatStat(item.sim.hit) + ' db=' + formatStat(item.db.hit));
    output.push('  CRIT: sim=' + formatStat(item.sim.crit) + ' db=' + formatStat(item.db.crit) +
                ' | ARP: sim=' + formatStat(item.sim.arp) + ' db=' + formatStat(item.db.arp) +
                ' | HASTE: sim=' + formatStat(item.sim.haste) + ' db=' + formatStat(item.db.haste));
    output.push('');
  });
});

fs.writeFileSync(__dirname + '/ITEM_REVIEW_CLEAN.txt', output.join('\n'));
console.log('Saved to test/ITEM_REVIEW_CLEAN.txt');
console.log('Items with differences: ' + withDiffs.length);
