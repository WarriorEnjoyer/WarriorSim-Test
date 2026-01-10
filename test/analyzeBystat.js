const fs = require('fs');
const results = JSON.parse(fs.readFileSync(__dirname + '/itemStatResults.json', 'utf8'));

// Filter out custom items
const realItems = results.discrepancies.filter(function(d) { return d.slot !== 'custom'; });

// Group by stat type
const bystat = {};

realItems.forEach(function(item) {
  item.differences.forEach(function(d) {
    if (!bystat[d.stat]) bystat[d.stat] = [];
    bystat[d.stat].push({
      name: item.name,
      id: item.id,
      slot: item.slot,
      sim: d.sim,
      db: d.db,
      diff: d.db - d.sim
    });
  });
});

// Print each stat category
const stats = ['str', 'agi', 'sta', 'ac', 'ap', 'crit', 'hit', 'arp', 'haste'];

stats.forEach(function(stat) {
  if (!bystat[stat] || bystat[stat].length === 0) return;

  console.log('');
  console.log('=== ' + stat.toUpperCase() + ' MISMATCHES (' + bystat[stat].length + ') ===');
  console.log('');

  // Sort by absolute difference
  bystat[stat].sort(function(a, b) { return Math.abs(b.diff) - Math.abs(a.diff); });

  bystat[stat].forEach(function(e) {
    var arrow = e.diff > 0 ? '(+' + e.diff + ')' : '(' + e.diff + ')';
    console.log(e.name + ' [' + e.slot + ']');
    console.log('  sim=' + e.sim + ' -> db=' + e.db + ' ' + arrow);
  });
});
