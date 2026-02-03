import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

type MenuSourceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
};

type MenuSourceItem = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  calories?: number | null;
  imageKey?: string | null;
};

type MenuSource = {
  source: {
    name: string;
    menuUrl: string;
    generatedAt: string;
    notes: string[];
  };
  categories: MenuSourceCategory[];
  items: MenuSourceItem[];
};

const DEFAULT_MENU_URL = 'https://www.bigboy.com/menu';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');

const DEFAULT_OUTPUT_PATH = path.join(
  serverRoot,
  'prisma',
  'menu_source',
  'bigboy.menu.json'
);

const DEFAULT_APP_OUTPUT_PATH = path.resolve(
  serverRoot,
  '..',
  'app',
  'src',
  'data',
  'bigboy.menu.json'
);

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'current-promotion': 'Current Promotion',
  appetizers: 'Appetizers',
  'sides/drinks': 'Sides + Drinks',
  breakfast: 'Breakfast',
  burger: 'Burgers',
  sandwiches: 'Sandwiches and Wraps',
  'soup/salad': 'Soups + Salads',
  dinners: 'Dinners',
  desserts: 'Desserts',
  kids: "Kids' Meals",
};

const HEADING_TO_CATEGORY_KEY: Record<string, string> = {
  'summer of slim jims & shakes!': 'current-promotion',
  appetizers: 'appetizers',
  'sides + drinks': 'sides/drinks',
  breakfast: 'breakfast',
  burgers: 'burger',
  dinners: 'dinners',
  desserts: 'desserts',
  'soups + salads': 'soup/salad',
  'sandwiches and wraps': 'sandwiches',
  "kids' meals": 'kids',
};

const DEFAULT_CATEGORY_ORDER = [
  'current-promotion',
  'appetizers',
  'sides/drinks',
  'breakfast',
  'burger',
  'sandwiches',
  'soup/salad',
  'dinners',
  'desserts',
  'kids',
];

const args = process.argv.slice(2);
const hasFlag = (flag: string) => args.includes(flag);
const getArgValue = (flag: string) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
};

const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[®™]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const normalizeCategoryKey = (value: string) => value.trim().toLowerCase();

const extractWarmupData = (html: string) => {
  const match = html.match(
    /<script type="application\/json" id="wix-warmup-data">([\s\S]*?)<\/script>/
  );
  if (!match) {
    throw new Error('Unable to find wix-warmup-data in menu HTML.');
  }
  return JSON.parse(match[1]);
};

const extractCategoryOrderFromHeadings = (html: string) => {
  const regex = /<h2[^>]*>(.*?)<\/h2>/g;
  const order: string[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const raw = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .trim()
      .toLowerCase();

    const categoryKey = HEADING_TO_CATEGORY_KEY[raw];
    if (categoryKey && !seen.has(categoryKey)) {
      order.push(categoryKey);
      seen.add(categoryKey);
    }
  }

  return order.length > 0 ? order : DEFAULT_CATEGORY_ORDER;
};

const wixImageToUrl = (image?: string | null) => {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  if (!image.startsWith('wix:image://v1/')) {
    return null;
  }
  const remainder = image.replace('wix:image://v1/', '');
  const mediaId = remainder.split('/')[0];
  if (!mediaId) return null;
  return `https://static.wixstatic.com/media/${mediaId}`;
};

const parseCalories = (calories?: string | null) => {
  if (!calories) return null;
  const matches = calories.match(/\d+/g);
  if (!matches || matches.length !== 1) {
    return null;
  }
  return Number(matches[0]);
};

const buildMenuSource = (html: string, menuUrl: string): MenuSource => {
  const warmupData = extractWarmupData(html);
  const records =
    warmupData?.appsWarmupData?.dataBinding?.dataStore?.recordsByCollectionId?.Menu ?? {};

  const rawItems = Object.values(records).filter((record: any) => {
    if (!record || typeof record !== 'object') return false;
    if (record._publishStatus && record._publishStatus !== 'PUBLISHED') return false;
    return !!record.title;
  }) as Array<Record<string, any>>;

  const categoryOrder = extractCategoryOrderFromHeadings(html);
  const categoryKeys = new Set<string>();

  rawItems.forEach((record) => {
    const key = normalizeCategoryKey(record.category ?? 'uncategorized');
    categoryKeys.add(key);
  });

  const orderedCategoryKeys = categoryOrder.filter((key) => categoryKeys.has(key));
  for (const key of categoryKeys) {
    if (!orderedCategoryKeys.includes(key)) {
      orderedCategoryKeys.push(key);
    }
  }

  const categories: MenuSourceCategory[] = orderedCategoryKeys.map((key, index) => {
    const name = CATEGORY_DISPLAY_NAMES[key] ?? key.replace(/(^.|[/-].)/g, (m) => m.toUpperCase());
    const slug = slugify(name);
    return {
      id: `cat-${slug}`,
      name,
      slug,
      description: null,
      sortOrder: index + 1,
    };
  });

  const categoryIdByKey = new Map<string, string>();
  categories.forEach((category) => {
    categoryIdByKey.set(normalizeCategoryKey(category.name), category.id);
    categoryIdByKey.set(normalizeCategoryKey(category.slug), category.id);
  });

  const categoryIdByKeyFallback = new Map<string, string>();
  orderedCategoryKeys.forEach((key, index) => {
    categoryIdByKeyFallback.set(key, categories[index]?.id ?? `cat-${slugify(key)}`);
  });

  const items: MenuSourceItem[] = rawItems.map((record) => {
    const rawCategoryKey = normalizeCategoryKey(record.category ?? 'uncategorized');
    const categoryId =
      categoryIdByKeyFallback.get(rawCategoryKey) ??
      categoryIdByKey.get(rawCategoryKey) ??
      `cat-${slugify(rawCategoryKey)}`;

    const name = record.title.toString().trim();
    const description = (record.description ?? '').toString().replace(/\s+/g, ' ').trim();
    const itemSlug = slugify(name);

    return {
      id: `item-${slugify(rawCategoryKey)}-${itemSlug}`,
      name,
      description,
      categoryId,
      calories: parseCalories(record.calories),
      imageKey: wixImageToUrl(record.image),
    };
  });

  const categoryOrderById = new Map<string, number>();
  categories.forEach((category) => {
    categoryOrderById.set(category.id, category.sortOrder);
  });

  items.sort((a, b) => {
    const orderA = categoryOrderById.get(a.categoryId) ?? Number.MAX_SAFE_INTEGER;
    const orderB = categoryOrderById.get(b.categoryId) ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return {
    source: {
      name: 'BigBoy.com',
      menuUrl,
      generatedAt: new Date().toISOString(),
      notes: [
        'Data extracted from BigBoy.com menu page wix-warmup-data payload.',
        'Calories are only captured when a single numeric value is present.',
        'Prices are not provided by BigBoy.com and are assigned during seeding.',
      ],
    },
    categories,
    items,
  };
};

const run = async () => {
  const fromFile = hasFlag('--from-file');
  const htmlPath = getArgValue('--html');
  const menuUrl = getArgValue('--url') ?? DEFAULT_MENU_URL;
  const outputPath = getArgValue('--out') ?? DEFAULT_OUTPUT_PATH;
  const appOutputPath = getArgValue('--app-out') ?? DEFAULT_APP_OUTPUT_PATH;
  const skipAppOutput = hasFlag('--no-app-copy');

  if (fromFile) {
    const existing = await fs.readFile(outputPath, 'utf8');
    const parsed = JSON.parse(existing) as MenuSource;
    console.log(
      `Loaded ${parsed.categories.length} categories and ${parsed.items.length} items from ${outputPath}`
    );
    return;
  }

  let html = '';
  if (htmlPath) {
    html = await fs.readFile(htmlPath, 'utf8');
  } else {
    const response = await fetch(menuUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch menu page (${response.status})`);
    }
    html = await response.text();
  }

  const menuSource = buildMenuSource(html, menuUrl);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(menuSource, null, 2));

  if (!skipAppOutput) {
    await fs.mkdir(path.dirname(appOutputPath), { recursive: true });
    await fs.writeFile(appOutputPath, JSON.stringify(menuSource, null, 2));
  }

  console.log(`Saved ${menuSource.items.length} items to ${outputPath}`);
  if (!skipAppOutput) {
    console.log(`Synced menu data to ${appOutputPath}`);
  }
};

run().catch((error) => {
  console.error('Menu import failed:', error);
  process.exit(1);
});
