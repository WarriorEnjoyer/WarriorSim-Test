const https = require('https');
const fs = require('fs');
const path = require('path');

const gearFilePath = path.join(__dirname, '../js/data/gear_turtle.js');
const gearContent = fs.readFileSync(gearFilePath, 'utf8');
const jsonStr = gearContent.replace(/^var gear\s*=\s*/, '').replace(/;\s*$/, '');
const gear = eval('(' + jsonStr + ')');

// Collect all items
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive'
      }
    };

    https.get(options, function(res) {
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { resolve(data); });
    }).on('error', reject);
  });
}

function parseItemHtml(html) {
  const stats = {};

  // Find the tooltip div
  const tooltipMatch = html.match(/id="tooltip\d+-generic"[^>]*>([\s\S]*?)<script/);
  if (!tooltipMatch) return stats;

  var tooltip = tooltipMatch[1];

  // IMPORTANT: Cut off everything after set bonus section starts
  // Set bonuses appear after "itemset" link or "(X) Set:" pattern
  var setIdx = tooltip.indexOf('itemset=');
  if (setIdx !== -1) {
    tooltip = tooltip.substring(0, setIdx);
  }

  // Also cut off at "(2) Set", "(3) Set", etc.
  var setPatternIdx = tooltip.search(/\(\d\) Set:/);
  if (setPatternIdx !== -1) {
    tooltip = tooltip.substring(0, setPatternIdx);
  }

  // Parse armor (only from item stats, not set bonus)
  const armorMatch = tooltip.match(/(\d+)\s*Armor/);
  if (armorMatch) stats.ac = parseInt(armorMatch[1]);

  // Parse basic stats
  const strMatch = tooltip.match(/\+(\d+)\s*Strength/i);
  if (strMatch) stats.str = parseInt(strMatch[1]);

  const agiMatch = tooltip.match(/\+(\d+)\s*Agility/i);
  if (agiMatch) stats.agi = parseInt(agiMatch[1]);

  const staMatch = tooltip.match(/\+(\d+)\s*Stamina/i);
  if (staMatch) stats.sta = parseInt(staMatch[1]);

  // Attack Power - but NOT feral AP
  // Feral AP contains "Cat, Bear" or "feral" in the text
  var apMatch = tooltip.match(/\+(\d+)\s*Attack Power/i);
  if (apMatch) {
    // Check if it's feral AP by looking at surrounding context
    var apContext = tooltip.substring(Math.max(0, tooltip.indexOf(apMatch[0]) - 50), tooltip.indexOf(apMatch[0]) + 100);
    if (!/Cat|Bear|feral|Moonkin/i.test(apContext)) {
      stats.ap = parseInt(apMatch[1]);
    }
  }

  // Crit - but only from item, not set bonus
  const critMatch = tooltip.match(/critical strike[^0-9]*(\d+)%/i);
  if (critMatch) stats.crit = parseInt(critMatch[1]);

  // Hit
  const hitMatch = tooltip.match(/chance to hit[^0-9]*(\d+)%/i) || tooltip.match(/hit by (\d+)%/i);
  if (hitMatch) stats.hit = parseInt(hitMatch[1]);

  // Armor penetration
  // Patterns: "X armor penetration" or "attacks ignore X of the target's armor"
  const arpMatch = tooltip.match(/(\d+)\s*armor penetration/i) ||
                   tooltip.match(/attacks ignore (\d+) of/i) ||
                   tooltip.match(/ignore (\d+) of your target's armor/i);
  if (arpMatch) stats.arp = parseInt(arpMatch[1]);

  // Haste
  // Patterns: "X% haste" or "attack and casting speed by X%"
  const hasteMatch = tooltip.match(/haste[^0-9]*(\d+)%/i) ||
                     tooltip.match(/(\d+)%\s*haste/i) ||
                     tooltip.match(/attack and casting speed by (\d+)%/i) ||
                     tooltip.match(/attack speed by (\d+)%/i);
  if (hasteMatch) stats.haste = parseInt(hasteMatch[1]);

  return stats;
}

function formatStat(val) {
  return val ? String(val) : '-';
}

async function main() {
  const results = [];

  console.log('Fetching item data (excluding set bonus stats)...');

  for (var i = 0; i < allItems.length; i++) {
    var item = allItems[i];

    // Skip custom items
    if (item.slot === 'custom') continue;

    try {
      var html = await fetchItem(item.id);
      var db = parseItemHtml(html);

      results.push({
        name: item.name,
        id: item.id,
        slot: item.slot,
        sim: {
          str: item.str || 0,
          agi: item.agi || 0,
          sta: item.sta || 0,
          ac: item.ac || 0,
          ap: item.ap || 0,
          crit: item.crit || 0,
          hit: item.hit || 0,
          arp: item.arp || 0,
          haste: item.haste || 0
        },
        db: {
          str: db.str || 0,
          agi: db.agi || 0,
          sta: db.sta || 0,
          ac: db.ac || 0,
          ap: db.ap || 0,
          crit: db.crit || 0,
          hit: db.hit || 0,
          arp: db.arp || 0,
          haste: db.haste || 0
        }
      });

      if ((i + 1) % 100 === 0) {
        console.log('Fetched ' + (i + 1) + '/' + allItems.length + '...');
      }

      await new Promise(function(r) { setTimeout(r, 80); });
    } catch (err) {
      console.error('Error fetching ' + item.name + ': ' + err.message);
    }
  }

  // Save JSON
  fs.writeFileSync(path.join(__dirname, 'allItemsV2.json'), JSON.stringify(results, null, 2));

  // Generate text output
  var output = [];
  output.push('================================================================================');
  output.push('              WARRIOR SIM ITEM COMPARISON (NO SET BONUS STATS)');
  output.push('                   Sim Values vs database.turtlecraft.gg');
  output.push('================================================================================');
  output.push('');
  output.push('Total items: ' + results.length);
  output.push('');

  // Group by slot
  var bySlot = {};
  results.forEach(function(item) {
    if (!bySlot[item.slot]) bySlot[item.slot] = [];
    bySlot[item.slot].push(item);
  });

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

  fs.writeFileSync(path.join(__dirname, 'ITEM_REVIEW_CLEAN.txt'), output.join('\n'));
  console.log('\nSaved to test/ITEM_REVIEW_CLEAN.txt');
  console.log('Total items: ' + results.length);
}

main();
