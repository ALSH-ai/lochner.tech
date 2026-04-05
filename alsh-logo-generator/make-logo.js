// make-logo.js
// Generates ALSH.ai logo assets with an Explora "L" and straight sans "AHS.ai".

const fs = require("fs/promises");
const path = require("path");
const opentype = require("opentype.js");
const { Resvg } = require("@resvg/resvg-js");

const WIDTH = 1400;
const HEIGHT = 900;

const CURVED_L_SIZE = 620;
const CURVED_L_SCALE = 0.74;
const CURVED_L_TRANSLATE_X = 62;
const CURVED_L_TRANSLATE_Y = 108;
const STRAIGHT_SIZE = 300;

const A_X = 90;
const A_Y = 560;

const L_X = 245;
const L_Y = 700;

const SH_X = 520;
const SH_Y = 560;
const DOT_AI_X = 960;
const DOT_AI_Y = 560;
const DOT_AI_SIZE = 140;

async function loadFont(fontPath) {
  const fontBuffer = await fs.readFile(fontPath);
  const arrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );

  return opentype.parse(arrayBuffer);
}

async function main() {
  const curvedFontPath =
    process.env.EXPLORA_FONT_PATH ||
    path.join(__dirname, "fonts", "Explora-Regular.ttf");

  const straightFontPath =
    process.env.STRAIGHT_FONT_PATH ||
    path.join(__dirname, "..", "assets", "fonts", "LochnerBrandSans-Regular.ttf");

  const [curvedFont, straightFont] = await Promise.all([
    loadFont(curvedFontPath),
    loadFont(straightFontPath),
  ]);

  const lGlyph = curvedFont.charToGlyph("L");
  if (!lGlyph) {
    throw new Error('Could not find glyph for "L" in curved font');
  }

  const lPath = lGlyph.getPath(L_X, L_Y - 40, CURVED_L_SIZE).toPathData({
    flipY: true,
    flipYBase: L_Y - 40,
    optimize: true,
    decimalPlaces: 2,
  });

  const aPath = straightFont.getPath("A", A_X, A_Y, STRAIGHT_SIZE).toPathData({
    flipY: true,
    flipYBase: A_Y,
    optimize: true,
    decimalPlaces: 2,
  });

  const shPath = straightFont.getPath("SH", SH_X, SH_Y, STRAIGHT_SIZE).toPathData({
    flipY: true,
    flipYBase: SH_Y,
    optimize: true,
    decimalPlaces: 2,
  });

  const dotAiPath = straightFont.getPath(".ai", DOT_AI_X, DOT_AI_Y, DOT_AI_SIZE).toPathData({
    flipY: true,
    flipYBase: DOT_AI_Y,
    optimize: true,
    decimalPlaces: 2,
  });

  const alshSvg = `\n    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">\n      <path d="${aPath}" fill="#FFFFFF"/>\n      <path d="${lPath}" fill="#FFFFFF" transform="translate(${CURVED_L_TRANSLATE_X} ${CURVED_L_TRANSLATE_Y}) scale(${CURVED_L_SCALE})"/>\n      <path d="${shPath}" fill="#FFFFFF"/>\n      <path d="${dotAiPath}" fill="#FFFFFF"/>\n    </svg>\n  `;

  const lSvg = `\n    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">\n      <path d="${lPath}" fill="#FFFFFF" transform="translate(${CURVED_L_TRANSLATE_X} ${CURVED_L_TRANSLATE_Y}) scale(${CURVED_L_SCALE})"/>\n    </svg>\n  `;

  await fs.writeFile(path.join(__dirname, "explora-l.svg"), lSvg, "utf8");
  await fs.writeFile(path.join(__dirname, "alsh-logo.svg"), alshSvg, "utf8");

  const alshResvg = new Resvg(alshSvg, {
    fitTo: { mode: "original" },
    background: "rgba(0,0,0,0)",
  });

  const lResvg = new Resvg(lSvg, {
    fitTo: { mode: "original" },
    background: "rgba(0,0,0,0)",
  });

  await fs.writeFile(path.join(__dirname, "alsh-logo.png"), alshResvg.render().asPng());
  await fs.writeFile(path.join(__dirname, "explora-l.png"), lResvg.render().asPng());

  console.log("Wrote alsh-logo.svg/png (A+L+SH+.ai) and explora-l.svg/png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
