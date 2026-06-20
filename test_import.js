import('./src/main.js').catch(err => {
  console.log(err.stack);
});
