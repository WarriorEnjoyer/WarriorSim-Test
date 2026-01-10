const https = require('https');
const fs = require('fs');
const path = require('path');

const gearFilePath = path.join(__dirname, '../js/data/gear_turtle.js');
const gearContent = fs.readFileSync(gearFilePath, 'utf8');
const jsonStr = gearContent.replace(/^var gear\s*=\s*/, '').replace(/;\s*$/, '');
const gear = eval('(' + jsonStr + ')');

const allItems = [];
for (const slot in gear) {
  if (Array.isArray(gear[slot])) {
    for (const item of gear[slot]) {
      if (item.id && item.name) allItems.push({ ...item, slot });
    }
  }
}

function fetchItem(itemId) {
  return new Promise(function(resolve, reject) {
    https.get('https://database.turtlecraft.gg/?item=' + itemId, function(res) {
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { resolve(data); });
    }).on('error', reject);
  });
}

function parseItemHtml(html) {
  const stats = {};
  const tooltipMatch = html.match(/id="tooltip\d+-generic"[^>]*>([\s\S]*?)<script/);
  if (!tooltipMatch) {
    return stats;
  }
  const tooltip = tooltipMatch[1];

  const armorMatch = tooltip.match(/(\d+)\s*Armor/);
  if (armorMatch) stats.ac = parseInt(armorMatch[1]);
  const strMatch = tooltip.match(/\+(\d+)\s*Strength/i);
  if (strMatch) stats.str = parseInt(strMatch[1]);
  const agiMatch = tooltip.match(/\+(\d+)\s*Agility/i);
  if (agiMatch) stats.agi = parseInt(agiMatch[1]);
  const hitMatch = tooltip.match(/hit by (\d+)%/i);
  if (hitMatch) stats.hit = parseInt(hitMatch[1]);
  const critMatch = tooltip.match(/critical strike[^0-9]*(\d+)%/i);
  if (critMatch) stats.crit = parseInt(critMatch[1]);
  const arpMatch = tooltip.match(/(\d+)\s*armor penetration/i);
  if (arpMatch) stats.arp = parseInt(arpMatch[1]);

  return stats;
}

async function test() {
  const testItems = allItems.slice(0, 10);
  for (var i = 0; i < testItems.length; i++) {
    var item = testItems[i];
    var html = await fetchItem(item.id);
    var dbStats = parseItemHtml(html);
    console.log(item.name + ' (ID: ' + item.id + ')');
    console.log('  Sim:  str=' + (item.str||0) + ' agi=' + (item.agi||0) + ' ac=' + (item.ac||0) + ' hit=' + (item.hit||0) + ' crit=' + (item.crit||0) + ' arp=' + (item.arp||0));
    console.log('  DB:   str=' + (dbStats.str||0) + ' agi=' + (dbStats.agi||0) + ' ac=' + (dbStats.ac||0) + ' hit=' + (dbStats.hit||0) + ' crit=' + (dbStats.crit||0) + ' arp=' + (dbStats.arp||0));

    // Check for differences
    var diffs = [];
    if ((item.str||0) !== (dbStats.str||0)) diffs.push('str');
    if ((item.agi||0) !== (dbStats.agi||0)) diffs.push('agi');
    if ((item.ac||0) !== (dbStats.ac||0)) diffs.push('ac');
    if ((item.hit||0) !== (dbStats.hit||0)) diffs.push('hit');
    if ((item.crit||0) !== (dbStats.crit||0)) diffs.push('crit');
    if ((item.arp||0) !== (dbStats.arp||0)) diffs.push('arp');

    if (diffs.length > 0) {
      console.log('  DIFF: ' + diffs.join(', '));
    } else {
      console.log('  OK');
    }
    console.log('');
    await new Promise(function(r) { setTimeout(r, 200); });
  }
}

test();
