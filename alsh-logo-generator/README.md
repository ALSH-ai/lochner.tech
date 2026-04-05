# ALSH Logo Generator

Generates:
- `alsh-logo.svg/png` with a curved Explora **L** plus straight sans **A** and **SH**
- `explora-l.svg/png` with just the curved **L**

## Fonts

The generator looks for:
- Curved L font: `./fonts/Explora-Regular.ttf` (relative to `alsh-logo-generator`)
- Straight font: `../assets/fonts/LochnerBrandSans-Regular.ttf`

You can override either path:

```bash
EXPLORA_FONT_PATH=/absolute/path/to/Explora-Regular.ttf \
STRAIGHT_FONT_PATH=/absolute/path/to/straight-font.ttf \
node make-logo.js
```

## Run

```bash
npm install
node make-logo.js
```

Optional: set an explicit output height (in px) and width is derived from the logo aspect ratio.

```bash
node make-logo.js -h 40
```
