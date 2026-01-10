const https = require('https');
const url = require('url');

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
      console.log('Status:', res.statusCode);
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { resolve(data); });
    }).on('error', reject);
  });
}

async function test() {
  var html = await fetchItem(47262);
  console.log('\nHTML length:', html.length);
  console.log('\nFirst 500 chars:\n', html.substring(0, 500));

  var tooltipMatch = html.match(/id="tooltip\d+-generic"/);
  console.log('\nTooltip ID found:', tooltipMatch ? 'YES' : 'NO');

  if (tooltipMatch) {
    // Try to extract stats
    var fullMatch = html.match(/id="tooltip\d+-generic"[^>]*>([\s\S]*?)<script/);
    if (fullMatch) {
      var tooltip = fullMatch[1];
      console.log('\nArmor match:', (tooltip.match(/(\d+)\s*Armor/) || ['none'])[0]);
      console.log('Strength match:', (tooltip.match(/\+(\d+)\s*Strength/i) || ['none'])[0]);
      console.log('Agility match:', (tooltip.match(/\+(\d+)\s*Agility/i) || ['none'])[0]);
    }
  }
}

test();
