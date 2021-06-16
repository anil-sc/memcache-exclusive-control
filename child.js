const fs = require('fs');
const moment = require('moment');
const os = require("os");
const MemcacheClient = require("memcache-client");
import dotenv from 'dotenv';
const env = dotenv.parse(fs.readFileSync('/etc/pic/.env'));
// env path
//MEMCACHE_SERVERS=pic-elasticache-test.bshg37.cfg.apne1.cache.amazonaws.com:11211
const server = 'pic-elasticache-test.bshg37.cfg.apne1.cache.amazonaws.com:11211';
const KEY_EXPIRE_TIME = 60000;
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

    const client = new MemcacheClient({ server });

    // create key
    const key = `/home/pic/backup/org${i}/cid${i}`;

    // add key that auto expires after 60 seconds
    // if key already exists new value will not be updated, it will give NOT_STORED response
    client
      .add(key, `path=${key}`, KEY_EXPIRE_TIME)
      .then((resp)=> {
          if(resp[0] === 'STORED') {
            console.log(`Locked :${key}`);
            try {
              if (fs.existsSync('counter.txt'))
                counter = parseInt(fs.readFileSync('counter.txt', 'utf-8'), 10);

              // Increment the counter.
              ++counter;

              log(`loop=${i}, counter=${counter}`);

              fs.writeFileSync('counter.txt', (counter).toString(), 'utf-8');
              console.log(`Complete file write at ${key}`)
            } finally {
              console.log(`Delete: ${key}\n`);
              client.delete(key);
            }
          }else {
            console.log('Error: key could not be stored');
          }
        }
      )
      .catch(e => {
        try {
          if(e.cmdTokens[0] === 'NOT_STORED') {
            console.log(`Another process is processing :${key}\n`);
          }
        }catch (e) {
          // connection error, network error
          console.log('Error: ',e)
        }
      })
  }
})();

