const { watch } = require('gulp');
const { exec } = require('child_process');

function rebuild(done) {
  exec('webpack', (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log(stdout);

    if (stderr) {
      console.warn(`stderr: ${stderr}`);
    }
  });

  done();
}

exports.default = () => {
  watch('src/', { ignoreInitial: false }, rebuild);
};