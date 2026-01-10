const fs = require('fs');

// Items to update from the cleaned review list (ID -> DB values to apply)
// Format: id -> { stat: dbValue, ... }
const itemsToUpdate = {
  // HEAD
  65026: { crit: 1 }, // Depthstalker Helm
  60258: { ap: 0 }, // Crown of Corruption - remove ap
  51769: { ac: 608 }, // Crown of the Dark Reaver
  61003: { agi: 12, sta: 22 }, // Timeskipper's Helm of Alacrity
  70057: { ac: 660, ap: 0 }, // Crown of Sacrifice (vs Undead) - remove ap
  20623: { ac: 183 }, // Circlet of Restless Dreams
  21460: { str: 22, agi: 14 }, // Helm of Domination
  13404: { ac: 132 }, // Mask of the Unforgiven

  // NECK
  22659: { ap: 30 }, // Medallion of the Dawn
  83484: { agi: 10 }, // Desert Wind Talisman
  17111: { agi: 13, sta: 14 }, // Blazefury Medallion

  // SHOULDER
  19139: { sta: 28 }, // Fireguard Shoulders
  60567: { arp: 30 }, // Blackhammer Pauldrons
  20212: { str: 22, agi: 18, ac: 602 }, // Arathi Plate Spaulders
  22001: { ac: 513 }, // Spaulders of Heroism

  // BACK
  83465: { haste: 0 }, // Shroud of Haunted Torment - remove haste
  51734: { sta: 12 }, // Shawl of Haunted Memories
  20073: { ac: 55 }, // Cloak of the Honor Guard
  17102: { agi: 26, ac: 58, haste: 1 }, // Cloak of the Shrouded Mists
  20691: { ac: 53 }, // Windshear Cape

  // CHEST
  60290: { agi: 5 }, // Rune-Etched Breastplate
  60153: { str: 17, agi: 17 }, // Gigno's Overalls
  19405: { ac: 392 }, // Malfurion's Blessed Bulwark
  22191: { ac: 458 }, // Obsidian Mail Tunic

  // WRIST
  17014: { sta: 12, ac: 343 }, // Dark Iron Bracer
  20476: { ap: 16 }, // Sandstalker Bracer
  61212: { ac: 96 }, // Sanctum Bark Wraps
  83433: { ac: 122 }, // Bloody Gladiator's Bands
  19578: { ac: 351 }, // Berserker Bracers
  21996: { ac: 299 }, // Bracers of Heroism

  // HANDS
  47265: { str: 28 }, // Dreadnaught Gloves
  55125: { str: 20, agi: 28, sta: 17, ap: 0, crit: 0, haste: 1 }, // Handwraps of Dead Winds
  61274: { ac: 249 }, // Pulverizer Gauntlets
  61213: { ac: 309 }, // Talonwind Gauntlets
  21278: { ap: 20, crit: 0, haste: 1 }, // Stormshroud Gloves
  83430: { agi: 10, ap: 0 }, // Bloody Gladiator's Gloves
  61013: { sta: 12, ac: 249 }, // Gauntlets of Temporal Guidance
  21998: { ac: 427 }, // Gauntlets of Heroism
  12639: { sta: 14 }, // Stronghold Gauntlets

  // WAIST - Sash of the Grand Betrayal handled specially below
  55357: { ap: 52, crit: 2, haste: 2, sta: 16, ac: 152 }, // Sash of the Grand Betrayal - USER PROVIDED VALUES
  60576: { sta: 10 }, // Hateforge Belt
  51749: { agi: 0 }, // Stonescale Girdle - remove agi
  20204: { sta: 12, ac: 414 }, // Arathi Plate Girdle
  21994: { ac: 385 }, // Belt of Heroism
  16864: { ac: 421 }, // Belt of Might
  19380: { sta: 24 }, // Therazane's Link

  // LEGS
  17013: { sta: 21, ac: 842 }, // Dark Iron Leggings
  81365: { ac: 146 }, // Kargron's Leggings
  61265: { ac: 174 }, // Leggings of the Inferno
  61239: { ac: 432 }, // Ancient Jade Leggings
  65025: { str: 18, agi: 25 }, // Flamewrath Leggings
  60360: { agi: 0, ap: 24 }, // Bloody Gladiator's Legguards
  20627: { ap: 48 }, // Dark Heart Pants
  22000: { agi: 11, ac: 598 }, // Legplates of Heroism
  16867: { sta: 24 }, // Legplates of Might
  22672: { ac: 703 }, // Sentinel's Plate Legguards

  // FEET
  61367: { ac: 502 }, // Dreamsteel Boots
  16982: { agi: 14, sta: 13, ac: 131 }, // Corehound Boots
  65027: { agi: 22 }, // Windwalker Boots
  83442: { str: 9, sta: 9 }, // Miasma Walkers
  20208: { agi: 14, sta: 15, ac: 511 }, // Arathi Plate Greaves
  16984: { sta: 12, ac: 290, ap: 34 }, // Black Dragonscale Boots

  // FINGER
  83217: { ap: 0 }, // Ring of Demonic Fury - remove ap

  // TRINKET
  58175: { agi: 8 }, // Blood-etched Fetish
  18537: { ap: 34 }, // Counterattack Lodestone

  // RANGED
  20599: { sta: 6, ap: 26 }, // Polished Ironwood Crossbow

  // MAINHAND
  55494: { crit: 1 }, // The Abyssal Pincer
  84030: { crit: 1 }, // Gauntlet of a Thousand Cuts
  60410: { ap: 20 }, // Willbreaker
  61001: { agi: 12, sta: 7 }, // Claw of the Infinite
  20578: { agi: 13 }, // Emerald Dragonfang
  19542: { agi: 14, sta: 7 }, // Scout's Blade
  20580: { sta: 13, ac: 100 }, // Hammer of Bestial Fury
  23456: { crit: 0, haste: 1 }, // R14 Swift Blade

  // OFFHAND
  61755: { str: 10, agi: 9 }, // Stagwood Grasp
  13246: { ap: 0, hit: 0 }, // Sandswept Obsidian Dagger - remove ap and hit
  18805: { ap: 22 }, // Core Hound Tooth
  20577: { sta: 10, ac: 75, ap: 34 }, // Nightmare Blade

  // TWOHAND
  81060: { ap: 0 }, // Tempered Runeblade - remove ap
  81369: { sta: 17 }, // Blade of the Blademaster
  60808: { str: 0 }, // Bone Fracture - remove str
  19354: { str: 22, sta: 25 }, // Draconic Avenger
  11931: { ap: 36 }, // Dreadforge Retaliator
  18502: { sta: 24 }, // Monstrous Glaive
  13163: { str: 14, agi: 12 }, // Relentless Scythe
  18542: { str: 16, sta: 18 }, // Typhoon
  19357: { agi: 17 }, // Herald of Woe
};

// Read the gear file
const gearPath = __dirname + '/../js/data/gear_turtle.js';
let gearContent = fs.readFileSync(gearPath, 'utf8');

// Track updates
let updateCount = 0;
const updatedItems = [];

// Process each item
for (const [idStr, updates] of Object.entries(itemsToUpdate)) {
  const id = parseInt(idStr);

  // Find all occurrences of this item ID in the file
  const idPattern = new RegExp(`"id":\\s*${id}\\b`, 'g');
  let match;
  let positions = [];

  while ((match = idPattern.exec(gearContent)) !== null) {
    positions.push(match.index);
  }

  if (positions.length === 0) {
    console.log(`WARNING: Item ID ${id} not found in gear file`);
    continue;
  }

  // For each position, find the item object boundaries and update
  for (const pos of positions.reverse()) { // Process in reverse to maintain positions
    // Find the start of this item object (look backwards for opening brace)
    let braceCount = 0;
    let objStart = pos;
    for (let i = pos; i >= 0; i--) {
      if (gearContent[i] === '}') braceCount++;
      if (gearContent[i] === '{') {
        if (braceCount === 0) {
          objStart = i;
          break;
        }
        braceCount--;
      }
    }

    // Find the end of this item object
    braceCount = 0;
    let objEnd = pos;
    for (let i = objStart; i < gearContent.length; i++) {
      if (gearContent[i] === '{') braceCount++;
      if (gearContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          objEnd = i + 1;
          break;
        }
      }
    }

    // Extract the item object
    let itemStr = gearContent.substring(objStart, objEnd);

    // Get item name for logging
    const nameMatch = itemStr.match(/"name":\s*"([^"]+)"/);
    const itemName = nameMatch ? nameMatch[1] : `ID ${id}`;

    // Apply updates
    for (const [stat, value] of Object.entries(updates)) {
      const statPattern = new RegExp(`"${stat}":\\s*-?\\d+`);

      if (value === 0) {
        // Remove the stat entirely (including trailing comma if present)
        const removePattern = new RegExp(`\\s*"${stat}":\\s*-?\\d+,?`);
        if (removePattern.test(itemStr)) {
          itemStr = itemStr.replace(removePattern, '');
          // Clean up any double commas or trailing commas before }
          itemStr = itemStr.replace(/,(\s*[}\]])/g, '$1');
          itemStr = itemStr.replace(/,\s*,/g, ',');
        }
      } else if (statPattern.test(itemStr)) {
        // Update existing stat
        itemStr = itemStr.replace(statPattern, `"${stat}": ${value}`);
      } else {
        // Add new stat after "name" line
        const insertPoint = itemStr.indexOf('"name"');
        const lineEnd = itemStr.indexOf('\n', insertPoint);
        if (lineEnd !== -1) {
          // Find proper indentation
          const indentMatch = itemStr.match(/\n(\s+)"name"/);
          const indent = indentMatch ? indentMatch[1] : '      ';
          itemStr = itemStr.substring(0, lineEnd + 1) +
                   indent + `"${stat}": ${value},\n` +
                   itemStr.substring(lineEnd + 1);
        }
      }
    }

    // Replace in the main content
    gearContent = gearContent.substring(0, objStart) + itemStr + gearContent.substring(objEnd);
    updateCount++;
    updatedItems.push(itemName);
  }
}

// Write back
fs.writeFileSync(gearPath, gearContent);

console.log(`Updated ${updateCount} item entries`);
console.log('\nUpdated items:');
updatedItems.forEach(name => console.log('  - ' + name));
