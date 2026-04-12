const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size, fontSize) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#006859";
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("X", size / 2, size / 2);

  return canvas.toBuffer("image/png");
}

const iconsDir = path.join(__dirname, "../public/icons");

fs.writeFileSync(path.join(iconsDir, "icon-192.png"), generateIcon(192, 96));
console.log("Generated icon-192.png");

fs.writeFileSync(path.join(iconsDir, "icon-512.png"), generateIcon(512, 256));
console.log("Generated icon-512.png");
