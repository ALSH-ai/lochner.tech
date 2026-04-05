// make-logo.js
// Generates ALSH.ai logo assets with an Explora "L" and straight sans "AHS.ai".

const fs = require("fs/promises");
const path = require("path");
const opentype = require("opentype.js");
const { Resvg } = require("@resvg/resvg-js");

const CANVAS_PADDING = 24;

const CURVED_L_SIZE = 620;
const CURVED_L_SCALE = 0.66;
const CURVED_L_TRANSLATE_X = 196;
const CURVED_L_TRANSLATE_Y = 124;
const STRAIGHT_SIZE = 300;

const A_X = 120;
const A_Y = 560;

const L_X = 245;
const L_Y = 700;

const SH_X = 520;
const SH_Y = 560;
const DOT_AI_X = 930;
const DOT_AI_Y = 560;
const DOT_AI_SIZE = 140;

function transformBounds(bounds, scale, translateX, translateY) {
  return {
    x1: bounds.x1 * scale + translateX,
    y1: bounds.y1 * scale + translateY,
    x2: bounds.x2 * scale + translateX,
    y2: bounds.y2 * scale + translateY,
  };
}

function mergeBounds(boundsList, padding = 0) {
  const x1 = Math.min(...boundsList.map((b) => b.x1));
  const y1 = Math.min(...boundsList.map((b) => b.y1));
  const x2 = Math.max(...boundsList.map((b) => b.x2));
  const y2 = Math.max(...boundsList.map((b) => b.y2));

  return {
    x: x1 - padding,
    y: y1 - padding,
    width: x2 - x1 + padding * 2,
    height: y2 - y1 + padding * 2,
  };
}

function pathBounds(pathObject) {
  const bounds = pathObject.getBoundingBox();
  return {
    x1: bounds.x1,
    y1: bounds.y1,
    x2: bounds.x2,
    y2: bounds.y2,
  };
}

async function loadFont(fontPath) {
  const fontBuffer = await fs.readFile(fontPath);
  const arrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );

  return opentype.parse(arrayBuffer);
}

function renderSvg({ width, height, viewBox, paths }) {
  return `\n    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">\n      ${paths.join("\n      ")}\n    </svg>\n  `;
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

  const lPathObject = lGlyph.getPath(L_X, L_Y - 40, CURVED_L_SIZE);
  const aPathObject = straightFont.getPath("A", A_X, A_Y, STRAIGHT_SIZE);
  const shPathObject = straightFont.getPath("SH", SH_X, SH_Y, STRAIGHT_SIZE);
  const dotAiPathObject = straightFont.getPath(".ai", DOT_AI_X, DOT_AI_Y, DOT_AI_SIZE);

  const lPath = lPathObject.toPathData({
    flipY: true,
    flipYBase: L_Y - 40,
    optimize: true,
    decimalPlaces: 2,
  });

  const aPath = aPathObject.toPathData({
    flipY: true,
    flipYBase: A_Y,
    optimize: true,
    decimalPlaces: 2,
  });

  const shPath = shPathObject.toPathData({
    flipY: true,
    flipYBase: SH_Y,
    optimize: true,
    decimalPlaces: 2,
  });

  const dotAiPath = dotAiPathObject.toPathData({
    flipY: true,
    flipYBase: DOT_AI_Y,
    optimize: true,
    decimalPlaces: 2,
  });

  const lBounds = transformBounds(
    pathBounds(lPathObject),
    CURVED_L_SCALE,
    CURVED_L_TRANSLATE_X,
    CURVED_L_TRANSLATE_Y
  );

  const alshBounds = mergeBounds(
    [pathBounds(aPathObject), lBounds, pathBounds(shPathObject), pathBounds(dotAiPathObject)],
    CANVAS_PADDING
  );

  const lOnlyBounds = mergeBounds([lBounds], CANVAS_PADDING);

  const alshSvg = renderSvg({
    width: Math.ceil(alshBounds.width),
    height: Math.ceil(alshBounds.height),
    viewBox: `${alshBounds.x} ${alshBounds.y} ${alshBounds.width} ${alshBounds.height}`,
    paths: [
      `<path d="${aPath}" fill="#FFFFFF"/>`,
      `<path d="${lPath}" fill="#FFFFFF" transform="translate(${CURVED_L_TRANSLATE_X} ${CURVED_L_TRANSLATE_Y}) scale(${CURVED_L_SCALE})"/>`,
      `<path d="${shPath}" fill="#FFFFFF"/>`,
      `<path d="${dotAiPath}" fill="#FFFFFF"/>`,
    ],
  });

  const lSvg = renderSvg({
    width: Math.ceil(lOnlyBounds.width),
    height: Math.ceil(lOnlyBounds.height),
    viewBox: `${lOnlyBounds.x} ${lOnlyBounds.y} ${lOnlyBounds.width} ${lOnlyBounds.height}`,
    paths: [
      `<path d="${lPath}" fill="#FFFFFF" transform="translate(${CURVED_L_TRANSLATE_X} ${CURVED_L_TRANSLATE_Y}) scale(${CURVED_L_SCALE})"/>`,
    ],
  });

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

  console.log("Wrote tightly-cropped alsh-logo.svg/png and explora-l.svg/png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
