// import process from 'node:process';

const fs = require('fs');
var http_test = require('http');

//if db folder does not exist, ensure to create it before loading anything else
if (!fs.existsSync('./db')) {
  fs.mkdirSync('./db');
}

const path = './lib/provider';
const provider = fs.readdirSync(path).filter((file) => file.endsWith('.js'));
const config = require('./conf/config.json');

const similarityCache = require('./lib/services/similarity-check/similarityCache');
const { setLastJobExecution } = require('./lib/services/storage/listingsStorage');
const jobStorage = require('./lib/services/storage/jobStorage');
const FredyRuntime = require('./lib/FredyRuntime');

const { duringWorkingHoursOrNotSet } = require('./lib/utils');

//starting the api service
require('./lib/api/api');

//assuming interval is always in minutes

const INTERVAL = config.interval * 60 * 1000;

/* eslint-disable no-console */
console.log(`Started Fredy successfully. Ui can be accessed via http://localhost:${config.port}`);
/* eslint-enable no-console */

// console.log(process.env);
if (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}

setInterval(
  (function exec() {
    const isDuringWorkingHoursOrNotSet = duringWorkingHoursOrNotSet(config, Date.now());

    // http-request own website to keep onrender.com free-service up and running.
    httpGetSelf();

    if (isDuringWorkingHoursOrNotSet) {
      console.log(`Running as scheduled (every ${config.interval} minutes)`);
      config.lastRun = Date.now();
      const fetchedProvider = provider
        .filter((provider) => provider.endsWith('.js'))
        .map((pro) => require(`${path}/${pro}`));

      jobStorage
        .getJobs()
        .filter((job) => job.enabled)
        .forEach((job) => {
          job.provider
            .filter((p) => fetchedProvider.find((fp) => fp.metaInformation.id === p.id) != null)
            .forEach(async (prov) => {
              const pro = fetchedProvider.find((fp) => fp.metaInformation.id === prov.id);
              pro.init(prov, job.blacklist);
              await new FredyRuntime(pro.config, job.notificationAdapter, prov.id, job.id, similarityCache).execute();
              setLastJobExecution(job.id);
            });
        });
    } else {
      /* eslint-disable no-console */
      console.debug('Working hours set. Skipping as outside of working hours.');
      /* eslint-enable no-console */
    }
    return exec;
  })(),
  INTERVAL
);

function httpGetSelf(){
  console.log('httpGetSelf executed');
  var options = {
    host: 'fredy-v26n.onrender.com',
    path: '/index.html',
    port: 5173
  };

  var req = http_test.get(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));

    // Buffer the body entirely for processing as a whole.
    // var bodyChunks = [];
    // res.on('data', function(chunk) {
    //   // You can process streamed parts here...
    //   bodyChunks.push(chunk);
    // }).on('end', function() {
    //   var body = Buffer.concat(bodyChunks);
    //   console.log('BODY: ' + body);
    //   // ...and/or process the entire body here.
    // })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}