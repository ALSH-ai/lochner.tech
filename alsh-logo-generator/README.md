# ALSH Logo Generator

## Get the Explora font

The generator looks for the font file at:

- `./fonts/Explora-Regular.ttf` (relative to `alsh-logo-generator`)

Steps:

1. Create the fonts directory:
   ```bash
   mkdir -p fonts
   ```
2. Download `Explora-Regular.ttf` from Google Fonts.
3. Save it as:
   ```text
   alsh-logo-generator/fonts/Explora-Regular.ttf
   ```

You can also point to a font file anywhere on your system:

```bash
EXPLORA_FONT_PATH=/absolute/path/to/Explora-Regular.ttf node make-logo.js
```

## Run

```bash
npm install
node make-logo.js
```

If Explora is not available, the script now falls back to a local serif font and still generates the PNG.
