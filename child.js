const fs = require('fs');
const moment = require('moment');
const os = require("os");
const memjs = require('memjs');
import dotenv from 'dotenv';
const env = dotenv.parse(fs.readFileSync('/etc/pic/.env'));
// env path
//MEMCACHE_SERVERS=pic-elasticache-test.bshg37.cfg.apne1.cache.amazonaws.com:11211

(async () => {
  // ID of this process.
  const pid = process.argv[2]||process.getuid();

  // Wait for the specified number of seconds.
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Returns a random integer.
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

  // Output log.
  const log = (message) => {
    message = `${moment().format('YYYY-MM-DD HH:mm:ss')} -> #${pid} ${message}`;
    console.log(message);
    fs.appendFileSync('debug.log', `${message}${os.EOL}`, 'utf-8');
  };

  for (let i=0; i<5; i++) {
    // Read counter from file.
    let counter = 0;

    //create memcache client
    const client = memjs.Client.create(env.MEMCACHE_SERVERS);
    try {
      // create key
      const key = `/home/pic/backup/org${i}/cid${i}`;

      client.get(key, function(err, val) {
        //console.table(`Processing for - ${key}`);
        if(val == null) {
          // 0 means key will not expires 
          client.set(key, key, {expires:0}, function(err, val) {});

          if (fs.existsSync('counter.txt'))
            counter = parseInt(fs.readFileSync('counter.txt', 'utf-8'), 10);

          // Increment the counter.
          ++counter;

          log(`loop=${i}, counter=${counter}`);

          fs.writeFileSync('counter.txt', (counter).toString(), 'utf-8');

          // delete key after writing
          client.delete(key);
          //console.table(`\nDeleted key= ${key}\n`)
        }else {
          console.log(`${key} is being processed`);
        }
      });
    }catch (e) {
      console.log('error= ',e);
    }finally {
      client.close();
    }
  }
})();

