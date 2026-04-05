// make-logo.js
//
// Generate a transparent PNG logo for: ALSH.ai
//
// Before running:
// 1) Put Explora-Regular.ttf in ./fonts/ (optional but recommended)
// 2) npm install
// 3) node make-logo.js
//
// Output:
//   ./alsh-logo.png

const fs = require("fs");
const path = require("path");
const { createCanvas, registerFont } = require("canvas");

// --------------------
// CONFIG
// --------------------

const OUTPUT_FILE = "alsh-logo.png";
const WIDTH = 2400;
const HEIGHT = 800;

const BACKGROUND = "rgba(0,0,0,0)";
const TEXT_COLOR = "#FFFFFF";

// Main default font for A, S, H, .
const FONT_FAMILY = "Georgia";
const FONT_WEIGHT = "700";
const FONT_STYLE = "normal";

const SIZE_MAIN = 320;
const SIZE_AI = 250;
const BASELINE_Y = 520;

const LETTER_SPACING = 10;
const DOT_TO_AI_SPACING = 14;
const EXTRA_TRACKING = 0;

// --------------------
// LOAD EXPLORA FOR THE L
// --------------------

const fontsDir = path.join(__dirname, "fonts");
const EXPLORA_FAMILY = "ALSHExplora";

function resolveExploraPath() {
  if (process.env.EXPLORA_FONT_PATH) {
    return process.env.EXPLORA_FONT_PATH;
  }

  const defaultPath = path.join(fontsDir, "Explora-Regular.ttf");
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }

  if (!fs.existsSync(fontsDir)) {
    return defaultPath;
  }

  const fontFiles = fs.readdirSync(fontsDir).filter((file) => /\.(ttf|otf)$/i.test(file));
  const exploraLike = fontFiles.find((file) => /explor/i.test(file));

  if (exploraLike) {
    return path.join(fontsDir, exploraLike);
  }

  return defaultPath;
}

const exploraPath = resolveExploraPath();
let hasExplora = false;

if (fs.existsSync(exploraPath)) {
  registerFont(exploraPath, {
    family: EXPLORA_FAMILY,
    weight: "400",
    style: "normal",
  });
  hasExplora = true;
} else {
  console.warn(
    [
      `Explora font not found at: ${exploraPath}`,
      "Using fallback font for the L.",
      "To use Explora:",
      "  1) Create ./fonts in alsh-logo-generator",
      "  2) Download Explora-Regular.ttf from Google Fonts",
      "  3) Save it as ./fonts/Explora-Regular.ttf",
      "  4) Re-run: node make-logo.js",
      "You can also set EXPLORA_FONT_PATH=/absolute/path/to/Explora-Regular.ttf",
    ].join("\n")
  );
}

// --------------------
// PARTS
// --------------------

const PARTS = [
  { text: "A", fontSize: SIZE_MAIN, dx: 0 },

  // Curvier custom L using Explora
  // Increased size so the thin strokes still feel substantial.
  // Extra spacing after it so it does not crowd the S.
  {
    text: "L",
    fontSize: 360,
    dx: 28,
    family: hasExplora ? EXPLORA_FAMILY : "Times New Roman",
    style: "normal",
    weight: hasExplora ? "400" : "700",
    yOffset: 10,
  },

  { text: "S", fontSize: SIZE_MAIN, dx: 18 },
  { text: "H", fontSize: SIZE_MAIN, dx: LETTER_SPACING },
  { text: ".", fontSize: SIZE_MAIN, dx: LETTER_SPACING },

  {
    text: "ai",
    fontSize: SIZE_AI,
    dx: DOT_TO_AI_SPACING,
    yOffset: 0,
    family: "Arial",
    style: "normal",
    weight: "700",
  },
];

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
  const width = ctx.measureText(part.text).width;
  return width * (part.stretchX || 1);
}

// --------------------
// DRAW
// --------------------

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

ctx.clearRect(0, 0, WIDTH, HEIGHT);
ctx.fillStyle = BACKGROUND;
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Measure total width for centering
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

  if (i > 0) {
    x += part.dx + EXTRA_TRACKING;
  }

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
