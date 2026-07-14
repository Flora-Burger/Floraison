import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = process.cwd();
const assetsDir = path.join(root, 'assets');
const sourcePath = path.join(assetsDir, 'logo-source.png');
const bg = '#FBF7F2';

/** Bande noire JPEG collée à droite et en bas du fichier source. */
const BLACK_BORDER = 15;

async function getCleanPipeline() {
  const meta = await sharp(sourcePath).metadata();
  const crop = Math.min(BLACK_BORDER, meta.width - 1, meta.height - 1);
  const side = Math.min(meta.width, meta.height) - crop;

  return sharp(sourcePath).extract({ left: 0, top: 0, width: side, height: side });
}

async function makeRoundIcon(size) {
  const flowerSize = Math.round(size * 0.9);
  const flower = await (await getCleanPipeline())
    .resize(flowerSize, flowerSize, {
      fit: 'contain',
      background: bg,
    })
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );

  const square = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: flower, gravity: 'center' }])
    .png()
    .toBuffer();

  const masked = await sharp(square)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: bg,
    },
  })
    .composite([{ input: masked, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function writeIcon(size, filename) {
  const buf = await makeRoundIcon(size);
  await sharp(buf).toFile(path.join(assetsDir, filename));
  console.log('wrote', filename, `${size}x${size}`);
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error('generate-icons: assets/logo-source.png introuvable');
    process.exit(1);
  }

  const cleaned = await (await getCleanPipeline())
    .resize(1024, 1024, { fit: 'contain', background: bg })
    .png()
    .toBuffer();
  await sharp(cleaned).toFile(path.join(assetsDir, 'logo-source-clean.png'));

  await writeIcon(1024, 'icon.png');
  await writeIcon(1024, 'android-icon-foreground.png');
  await writeIcon(512, 'icon-512.png');
  await writeIcon(192, 'icon-192.png');
  await writeIcon(512, 'splash-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
