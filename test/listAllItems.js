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
  const tooltipMatch = html.match(/id="tooltip\d+-generic"[^>]*>([\s\S]*?)<script/);
  if (!tooltipMatch) return stats;
  const tooltip = tooltipMatch[1];

  const armorMatch = tooltip.match(/(\d+)\s*Armor/);
  if (armorMatch) stats.ac = parseInt(armorMatch[1]);

  const strMatch = tooltip.match(/\+(\d+)\s*Strength/i);
  if (strMatch) stats.str = parseInt(strMatch[1]);

  const agiMatch = tooltip.match(/\+(\d+)\s*Agility/i);
  if (agiMatch) stats.agi = parseInt(agiMatch[1]);

  const staMatch = tooltip.match(/\+(\d+)\s*Stamina/i);
  if (staMatch) stats.sta = parseInt(staMatch[1]);

  const apMatch = tooltip.match(/\+(\d+)\s*Attack Power/i);
  if (apMatch) stats.ap = parseInt(apMatch[1]);

  const critMatch = tooltip.match(/critical strike[^0-9]*(\d+)%/i);
  if (critMatch) stats.crit = parseInt(critMatch[1]);

  const hitMatch = tooltip.match(/chance to hit[^0-9]*(\d+)%/i) || tooltip.match(/hit by (\d+)%/i);
  if (hitMatch) stats.hit = parseInt(hitMatch[1]);

  const arpMatch = tooltip.match(/(\d+)\s*armor penetration/i);
  if (arpMatch) stats.arp = parseInt(arpMatch[1]);

  const hasteMatch = tooltip.match(/haste[^0-9]*(\d+)%/i) || tooltip.match(/(\d+)%\s*haste/i);
  if (hasteMatch) stats.haste = parseInt(hasteMatch[1]);

  return stats;
}

function formatStat(val) {
  return val ? String(val) : '-';
}

async function main() {
  const results = [];

  console.log('Fetching item data from database...');

  for (var i = 0; i < allItems.length; i++) {
    var item = allItems[i];
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

  // Save full results
  fs.writeFileSync(path.join(__dirname, 'allItemsComparison.json'), JSON.stringify(results, null, 2));

  // Print table
  console.log('\n');

  // Group by slot
  const slots = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'ranged', 'mainhand', 'offhand', 'twohand'];

  slots.forEach(function(slot) {
    var slotItems = results.filter(function(r) { return r.slot === slot; });
    if (slotItems.length === 0) return;

    console.log('\n=== ' + slot.toUpperCase() + ' ===\n');

    slotItems.forEach(function(item) {
      console.log(item.name + ' (ID: ' + item.id + ')');
      console.log('  STR: sim=' + formatStat(item.sim.str) + ' db=' + formatStat(item.db.str) +
                  ' | AGI: sim=' + formatStat(item.sim.agi) + ' db=' + formatStat(item.db.agi) +
                  ' | STA: sim=' + formatStat(item.sim.sta) + ' db=' + formatStat(item.db.sta));
      console.log('  AC: sim=' + formatStat(item.sim.ac) + ' db=' + formatStat(item.db.ac) +
                  ' | AP: sim=' + formatStat(item.sim.ap) + ' db=' + formatStat(item.db.ap) +
                  ' | HIT: sim=' + formatStat(item.sim.hit) + ' db=' + formatStat(item.db.hit));
      console.log('  CRIT: sim=' + formatStat(item.sim.crit) + ' db=' + formatStat(item.db.crit) +
                  ' | ARP: sim=' + formatStat(item.sim.arp) + ' db=' + formatStat(item.db.arp) +
                  ' | HASTE: sim=' + formatStat(item.sim.haste) + ' db=' + formatStat(item.db.haste));
      console.log('');
    });
  });

  console.log('\nFull data saved to test/allItemsComparison.json');
}

main();
