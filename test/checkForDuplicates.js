const { sets, gear, enchant } = require('../js/data/gear.js');
let duplicateList = {};

for (const slot in gear) {
  for (const i in gear[slot]) {
    var itemId = gear[slot][i].id;
    if (itemId) {
      if (duplicateList[itemId]) {
        console.log("Found a duplicate item ID: "+itemId);
      }
      duplicateList[itemId] = true;
    }
  }
}

for (const slot in enchant) {
  for (const i in enchant[slot]) {
    var enchantId = enchant[slot][i].id;
    if (enchantId) {
      if (duplicateList[enchantId]) {
        console.log("Found a duplicate enchant ID: "+enchantId);
      }
      duplicateList[enchantId] = true;
    }
  }
}

for (const i in sets) {
  var setId = sets[i].id;
  if (setId) {
    if (duplicateList[setId]) {
      console.log("Found a duplicate set ID: "+setId);
    }
    duplicateList[setId] = true;
  }
}
