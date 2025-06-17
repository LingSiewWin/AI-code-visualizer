let t = 0;

function setup() {
  createCanvas(400, 400);
}

function a(x, y) {
  let k = 5 * cos(x / 14) * cos(y / 30);
  let e = y / 8 - 13;
  let d = mag(k, e) ** 2 / 53 + 4;
  let atan2KE = atan2(k, e);
  let sinTerm1 = sin(atan2KE * e);
  let q = 45 - 3 * sinTerm1;
  let sinTerm2 = sin(d * d - t * 4);
  let kTerm = k * (3 + 4 / d * sinTerm2);
  let c = d / 2 + e / 99 - t / 18;
  let xCoord = (q + kTerm) * sin(c) + 200;
  let yCoord = (q + d * 9) * cos(c) + 200;
  point(xCoord, yCoord);
}

function draw() {
  background(9);
  stroke(255, 66); // White stroke with slight transparency
  t += PI / 10;
  for (let i = 0; i < 10000; i++) {
    let x = i % 200; // Adjusted for better distribution
    let y = i / 43;  // Consistent with original logic
    a(x, y);
  }
}