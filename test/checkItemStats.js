const https = require('https');
const fs = require('fs');
const path = require('path');

// Read and parse gear file
const gearFilePath = path.join(__dirname, '../js/data/gear_turtle.js');
const gearContent = fs.readFileSync(gearFilePath, 'utf8');

// Extract the gear object
const jsonStr = gearContent.replace(/^var gear\s*=\s*/, '').replace(/;\s*$/, '');
const gear = eval('(' + jsonStr + ')');

// Collect all items with IDs
const allItems = [];
for (const slot in gear) {
  if (Array.isArray(gear[slot])) {
    for (const item of gear[slot]) {
      if (item.id && item.name) {
        allItems.push({ ...item, slot });
      }
    }
  }
}

console.log('Found ' + allItems.length + ' items with IDs\n');

function fetchItem(itemId) {
  return new Promise(function(resolve, reject) {
    const options = {
      hostname: 'database.turtlecraft.gg',
      path: '/?item=' + itemId,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };

    https.get(options, function(res) {
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { resolve(data); });
    }).on('error', reject);
  });
}

function parseItemHtml(html, itemId) {
  const stats = {};

  // Find the tooltip div (id="tooltip####-generic")
  const tooltipMatch = html.match(/id="tooltip\d+-generic"[^>]*>([\s\S]*?)<script/);
  if (!tooltipMatch) {
    return stats;
  }

  const tooltip = tooltipMatch[1];

  // Parse armor
  const armorMatch = tooltip.match(/(\d+)\s*Armor/);
  if (armorMatch) stats.ac = parseInt(armorMatch[1]);

  // Parse basic stats (+X Strength, +X Agility, etc.)
  const strMatch = tooltip.match(/\+(\d+)\s*Strength/i);
  if (strMatch) stats.str = parseInt(strMatch[1]);

  const agiMatch = tooltip.match(/\+(\d+)\s*Agility/i);
  if (agiMatch) stats.agi = parseInt(agiMatch[1]);

  const staMatch = tooltip.match(/\+(\d+)\s*Stamina/i);
  if (staMatch) stats.sta = parseInt(staMatch[1]);

  const apMatch = tooltip.match(/\+(\d+)\s*Attack Power/i);
  if (apMatch) stats.ap = parseInt(apMatch[1]);

  // Parse percentage stats from equip effects
  const critMatch = tooltip.match(/critical strike[^0-9]*(\d+)%/i);
  if (critMatch) stats.crit = parseInt(critMatch[1]);

  const hitMatch = tooltip.match(/chance to hit[^0-9]*(\d+)%/i) || tooltip.match(/hit by (\d+)%/i);
  if (hitMatch) stats.hit = parseInt(hitMatch[1]);

  // Armor penetration
  const arpMatch = tooltip.match(/(\d+)\s*armor penetration/i) ||
                   tooltip.match(/armor penetration[^0-9]*(\d+)/i) ||
                   tooltip.match(/Decreases the armor of your target by (\d+)/i);
  if (arpMatch) stats.arp = parseInt(arpMatch[1]);

  // Haste
  const hasteMatch = tooltip.match(/haste[^0-9]*(\d+)%/i) ||
                     tooltip.match(/(\d+)%\s*haste/i) ||
                     tooltip.match(/attack speed[^0-9]*(\d+)%/i);
  if (hasteMatch) stats.haste = parseInt(hasteMatch[1]);

  return stats;
}

function compareStats(simItem, dbStats) {
  const differences = [];
  // Only compare DPS-relevant stats that the sim tracks
  const relevantStats = ['str', 'agi', 'sta', 'ac', 'ap', 'crit', 'hit', 'arp', 'haste'];

  for (var i = 0; i < relevantStats.length; i++) {
    var stat = relevantStats[i];
    var simVal = simItem[stat] || 0;
    var dbVal = dbStats[stat] || 0;

    // Only report if there's an actual difference and at least one side has a value
    if (simVal !== dbVal && (simVal > 0 || dbVal > 0)) {
      differences.push({
        stat: stat,
        sim: simVal,
        db: dbVal
      });
    }
  }

  return differences;
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function checkItems() {
  const discrepancies = [];
  const errors = [];
  let checked = 0;
  let successfulParses = 0;

  // Process sequentially to avoid issues
  for (var i = 0; i < allItems.length; i++) {
    var item = allItems[i];
    try {
      var html = await fetchItem(item.id);
      var dbStats = parseItemHtml(html, item.id);

      // Count successful parses (where we got at least some stats)
      if (Object.keys(dbStats).length > 0) {
        successfulParses++;
      }

      var diffs = compareStats(item, dbStats);

      if (diffs.length > 0) {
        discrepancies.push({
          name: item.name,
          id: item.id,
          slot: item.slot,
          differences: diffs
        });
      }
      checked++;

      if (checked % 100 === 0) {
        console.log('Checked ' + checked + '/' + allItems.length + ' items (successful parses: ' + successfulParses + ')...');
      }

      // Small delay to be nice to the server
      await sleep(100);
    } catch (err) {
      errors.push({ name: item.name, id: item.id, error: err.message });
    }
  }

  console.log('\n=== RESULTS ===');
  console.log('Checked: ' + checked + ' items');
  console.log('Successful parses: ' + successfulParses);
  console.log('Discrepancies found: ' + discrepancies.length);
  console.log('Errors: ' + errors.length + '\n');

  if (discrepancies.length > 0) {
    console.log('=== DISCREPANCIES ===\n');
    for (var j = 0; j < discrepancies.length; j++) {
      var d = discrepancies[j];
      console.log(d.name + ' (ID: ' + d.id + ', Slot: ' + d.slot + ')');
      for (var k = 0; k < d.differences.length; k++) {
        var diff = d.differences[k];
        console.log('  ' + diff.stat + ': sim=' + diff.sim + ', database=' + diff.db);
      }
      console.log('');
    }
  }

  if (errors.length > 0) {
    console.log('=== ERRORS ===\n');
    for (var l = 0; l < errors.length; l++) {
      var e = errors[l];
      console.log(e.name + ' (ID: ' + e.id + '): ' + e.error);
    }
  }

  // Save results to file
  var results = { discrepancies: discrepancies, errors: errors, checked: checked, total: allItems.length, successfulParses: successfulParses };
  fs.writeFileSync(
    path.join(__dirname, 'itemStatResults.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nResults saved to test/itemStatResults.json');
}

checkItems().catch(console.error);
