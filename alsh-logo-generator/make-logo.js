// make-logo.js
//
// Generate a transparent PNG logo for: ALSH.ai
//
// Install:
//   npm install
//
// Run:
//   node make-logo.js
//
// Output:
//   ./alsh-logo.png

const fs = require("fs");
const { createCanvas, registerFont } = require("canvas");

// --------------------
// CONFIG
// --------------------

const OUTPUT_FILE = "alsh-logo.png";
const WIDTH = 2400;
const HEIGHT = 800;

// Transparent background
const BACKGROUND = "rgba(0,0,0,0)";
const TEXT_COLOR = "#FFFFFF";

// Pick a font you actually have.
// If you have a brand font file, put it next to this script and uncomment registerFont.
// registerFont("./YourBrandFont.ttf", { family: "BrandFont" });
// const FONT_FAMILY = "BrandFont";

const FONT_FAMILY = "Georgia";
const FONT_WEIGHT = "700";
const FONT_STYLE = "normal";

const SIZE_MAIN = 320;
const SIZE_AI = 250;

// Baseline
const BASELINE_Y = 520;

// Manual character spacing.
// Keep spacing consistent across the wordmark so no pair feels too tight/wide.
const LETTER_SPACING = 10;
const DOT_TO_AI_SPACING = 14;

const PARTS = [
  { text: "A", fontSize: SIZE_MAIN, dx: 0 },
  // Use a real uppercase "L" glyph from a curved serif italic face.
  { text: "L", fontSize: SIZE_MAIN, dx: LETTER_SPACING, family: "Times New Roman", style: "italic" },
  { text: "S", fontSize: SIZE_MAIN, dx: LETTER_SPACING },
  { text: "H", fontSize: SIZE_MAIN, dx: LETTER_SPACING },
  { text: ".", fontSize: SIZE_MAIN, dx: LETTER_SPACING },
  {
    text: "ai",
    fontSize: SIZE_AI,
    dx: DOT_TO_AI_SPACING,
    yOffset: 0,
    family: "Arial",
    style: "normal",
    weight: "700"
  }
];

// Add overall letter tracking if you want more openness.
const EXTRA_TRACKING = 0;

// --------------------
// HELPERS
// --------------------

function setFont(ctx, part) {
  const size = part.fontSize;
  const family = part.family || FONT_FAMILY;
  const weight = part.weight || FONT_WEIGHT;
  const style = part.style || FONT_STYLE;
  ctx.font = `${style} ${weight} ${size}px "${family}"`;
}

function measurePart(ctx, part) {
  setFont(ctx, part);
  const metrics = ctx.measureText(part.text).width;
  return metrics * (part.stretchX || 1);
}

// --------------------
// DRAW
// --------------------

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// Transparent background
ctx.clearRect(0, 0, WIDTH, HEIGHT);
ctx.fillStyle = BACKGROUND;
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Measure total width first so we can center it.
let totalWidth = 0;
for (let i = 0; i < PARTS.length; i++) {
  const part = PARTS[i];
  totalWidth += measurePart(ctx, part);
  if (i > 0) totalWidth += part.dx;
  totalWidth += EXTRA_TRACKING;
}

let x = Math.round((WIDTH - totalWidth) / 2);

// Draw text
ctx.fillStyle = TEXT_COLOR;
ctx.textBaseline = "alphabetic";

for (let i = 0; i < PARTS.length; i++) {
  const part = PARTS[i];
  if (i > 0) x += part.dx + EXTRA_TRACKING;

  const y = BASELINE_Y + (part.yOffset || 0);

  setFont(ctx, part);
  const stretchX = part.stretchX || 1;
  if (stretchX !== 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(stretchX, 1);
    ctx.fillText(part.text, 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(part.text, x, y);
  }

  x += measurePart(ctx, part);
}

// Save PNG
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(OUTPUT_FILE, buffer);

console.log(`Wrote ${OUTPUT_FILE}`);
