type ControlPlaneLocaleCode = 'en' | 'zh-CN';

export interface CatalogEmoji {
  unicode: string;
  label: string;
  searchText: string;
  group: number | null;
}

const loaders = {
  en: () => import('emojibase-data/en/compact.json'),
  'zh-CN': () => import('emojibase-data/zh/compact.json'),
} satisfies Record<ControlPlaneLocaleCode, () => Promise<unknown>>;

type EmojiData = Awaited<ReturnType<typeof loaders.en>>['default'];
const singleEmoji = new RegExp('^\\p{RGI_Emoji}$', 'v');
const cache = new Map<ControlPlaneLocaleCode, Promise<CatalogEmoji[]>>();
const canonicalUnicode = (unicode: string) => unicode.replace(/(\p{Emoji_Presentation})\uFE0F/gu, '$1');

function flatten(data: EmojiData) {
  return data.flatMap(emoji => [emoji, ...(emoji.skins ?? []).map(skin => ({
    ...skin, tags: [...(emoji.tags ?? []), ...(skin.tags ?? [])],
  }))]).map(emoji => ({ ...emoji, unicode: canonicalUnicode(emoji.unicode) }));
}

export function loadEmojiCatalog(requestedLocale: string): Promise<CatalogEmoji[]> {
  const locale = Object.hasOwn(loaders, requestedLocale) ? requestedLocale as ControlPlaneLocaleCode : 'en';
  const cached = cache.get(locale);
  if (cached) return cached;
  const pending = Promise.all([loaders[locale](), loaders.en()]).then(([localized, english]) => {
    const englishByUnicode = new Map(flatten(english.default).map(emoji => [emoji.unicode, emoji]));
    return flatten(localized.default)
      .filter(emoji => singleEmoji.test(emoji.unicode))
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map(emoji => {
        const en = englishByUnicode.get(emoji.unicode);
        return {
          unicode: emoji.unicode,
          label: emoji.label,
          group: emoji.group ?? null,
          searchText: [emoji.label, ...(emoji.tags ?? []), en?.label, ...(en?.tags ?? [])].join(' ').toLowerCase(),
        };
      });
  }).catch(error => {
    cache.delete(locale);
    throw error;
  });
  cache.set(locale, pending);
  return pending;
}

export function searchEmojiCatalog(catalog: CatalogEmoji[], query: string): CatalogEmoji[] {
  const search = canonicalUnicode(query.trim().toLowerCase());
  if (singleEmoji.test(search)) {
    return [catalog.find(emoji => emoji.unicode === search) ?? { unicode: search, label: search, searchText: search, group: null }];
  }
  const terms = search.split(/\s+/).filter(Boolean);
  return catalog.filter(emoji => terms.every(term => emoji.searchText.includes(term)));
}
