const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const chokidar = require('chokidar');
const merge = require('merge');
const { name } = require('./package.json');

require('colors');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const createDirIfNotExist = to => {
  const dirs = [];
  let dir = path.dirname(to);

  while (dir !== path.dirname(dir)) {
    dirs.unshift(dir);
    dir = path.dirname(dir);
  }

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
};

module.exports = ({ input, output, watch = false, verbose = false }) => {
  const run = async () => {
    try {
      const files = await Promise.all(input.map(i => readFileAsync(i)));

      createDirIfNotExist(output);
      await writeFileAsync(output, JSON.stringify(merge(...files.map(i => JSON.parse(i))), null, '  '));

      if (verbose) {
        console.log('[MERGE][COMPLETE]'.yellow, output);
      }
    } catch (e) {
      console.log('[MERGE][ERROR]'.red, output);
      console.error(e);
    }
  };

  let once = true;
  return {
    name,
    buildStart() {
      if (once) {
        once = false;

        if (watch) {
          chokidar.watch(input)
            .on('add', run)
            .on('change', run)
            .on('unlink', run)
            .on('error', e => console.error(e));
        } else {
          run();
        }
      }
    }
  };
};
