import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

type MenuSource = {
  items: Array<{
    id: string;
    name: string;
    imageKey?: string | null;
  }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MENU_SOURCE_PATH = path.join(__dirname, '..', 'prisma', 'menu_source', 'bigboy.menu.json');
const IMAGE_DIR = path.join(__dirname, '..', '..', 'app', 'assets', 'menu_images_fixed');

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);

const run = async () => {
  const raw = await fs.readFile(MENU_SOURCE_PATH, 'utf8');
  const menuSource = JSON.parse(raw) as MenuSource;

  const missing: Array<{ id: string; name: string; imageKey: string }> = [];

  for (const item of menuSource.items) {
    const imageKey = item.imageKey?.trim();
    if (!imageKey || isRemoteUrl(imageKey)) {
      continue;
    }

    const imagePath = path.join(IMAGE_DIR, imageKey);
    try {
      await fs.access(imagePath);
    } catch {
      missing.push({ id: item.id, name: item.name, imageKey });
    }
  }

  if (missing.length === 0) {
    console.log('✓ All local image keys exist in app/assets/menu_images_fixed');
    return;
  }

  console.log('Missing local menu images:');
  missing.forEach((entry) => {
    console.log(`- ${entry.imageKey} (${entry.name}, ${entry.id})`);
  });

  process.exitCode = 1;
};

run().catch((error) => {
  console.error('Image validation failed:', error);
  process.exit(1);
});
