const player = { x: 100, y: 100, width: 32, height: 38 };
const enemy = { x: 100, y: 100, width: 32, height: 38 };
const inset = 4;
const playerBox = {
  left: player.x + inset,
  right: player.x + player.width - inset,
  top: player.y + inset,
  bottom: player.y + player.height - inset,
};
const eBox = {
  left: enemy.x + inset,
  right: enemy.x + enemy.width - inset,
  top: enemy.y + inset,
  bottom: enemy.y + enemy.height - inset,
};
const overlapping = !(
  playerBox.right < eBox.left ||
  playerBox.left > eBox.right ||
  playerBox.bottom < eBox.top ||
  playerBox.top > eBox.bottom
);
console.log('overlapping:', overlapping);
