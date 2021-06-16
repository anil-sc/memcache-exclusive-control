const {exec, fork} = require('child_process');
const fs = require('fs');

// Delete counter file.
if (fs.existsSync('counter.txt'))
  fs.unlinkSync('counter.txt');

//
// CASE 1 Start multiple child processes at the same time.
fork('child.js', ['child1']);
fork('child.js', ['child1']);


// CASE 2 Start multiple child processes after some time delay.
// fork('child.js', ['child1']);
// setTimeout(() => {
//   fork('child.js', ['child2']);
// },100);