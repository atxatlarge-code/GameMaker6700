const inset = 4;
const playerBox = {
  left: 200 + inset,
  right: 200 + 32 - inset,
  top: 400 + inset,
  bottom: 400 + 38 - inset,
};
const eBox = {
  left: 200 + inset,
  right: 200 + 32 - inset,
  top: 400 + inset,
  bottom: 400 + 38 - inset,
};
const overlapping = !(
  playerBox.right < eBox.left ||
  playerBox.left > eBox.right ||
  playerBox.bottom < eBox.top ||
  playerBox.top > eBox.bottom
);
console.log(overlapping);
