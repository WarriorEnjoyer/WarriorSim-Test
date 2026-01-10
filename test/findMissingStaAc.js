const fs = require('fs');
const results = JSON.parse(fs.readFileSync(__dirname + '/allItemsV2.json', 'utf8'));

// Find items where sim has 0 but db has a value for STA or AC
const needsUpdate = [];

results.forEach(function(item) {
  const updates = [];

  // Check STA: sim=0 but db>0
  if (item.sim.sta === 0 && item.db.sta > 0) {
    updates.push({ stat: 'sta', dbValue: item.db.sta });
  }

  // Check AC: sim=0 but db>0
  if (item.sim.ac === 0 && item.db.ac > 0) {
    updates.push({ stat: 'ac', dbValue: item.db.ac });
  }

  if (updates.length > 0) {
    needsUpdate.push({
      name: item.name,
      id: item.id,
      slot: item.slot,
      updates: updates
    });
  }
});

console.log('Items needing STA or AC updates: ' + needsUpdate.length + '\n');

needsUpdate.forEach(function(item) {
  console.log(item.name + ' (ID: ' + item.id + ', slot: ' + item.slot + ')');
  item.updates.forEach(function(u) {
    console.log('  Add ' + u.stat + ': ' + u.dbValue);
  });
});

// Save to JSON for processing
fs.writeFileSync(__dirname + '/itemsNeedingStaAc.json', JSON.stringify(needsUpdate, null, 2));
console.log('\nSaved to test/itemsNeedingStaAc.json');
