import { BASE_PATH } from '@/lib/paths';

// Bundled starter images (public/demo, 1080px long edge) seeded into the
// asset list so every template opens populated with real photos instead of
// numbered placeholders. Users can clear/replace them like any upload.
export const DEMO_ASSETS = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    name: `Demo ${n}`,
    url: `${BASE_PATH}/demo/demo-${n}.jpg`,
  };
});

export function demoSourceForSlot(index: number) {
  const source = DEMO_ASSETS[((index % DEMO_ASSETS.length) + DEMO_ASSETS.length) % DEMO_ASSETS.length];
  return { ...source };
}

export function isDemoAssetSource(asset: { origin?: string; url?: string }): boolean {
  return asset.origin === 'demo' || /\/demo\/demo-\d{2}\.jpg(?:[?#].*)?$/.test(asset.url ?? '');
}
