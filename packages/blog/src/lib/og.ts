import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './paths.js';

const OG_DIR = join(DIST, 'og');
const loraPath = join(import.meta.dirname, '..', '..', 'public', 'fonts', 'Lora-Bold.ttf');
const logoPath = join(import.meta.dirname, '..', '..', 'public', 'icons', 'logo.svg');
const sparklePath = join(import.meta.dirname, '..', '..', 'public', 'icons', 'sparkle.svg');

let fontData: ArrayBuffer | undefined;
let logoSvg: string | undefined;
let sparkleSvg: string | undefined;

function getFont(): ArrayBuffer {
  if (fontData) return fontData;
  fontData = readFileSync(loraPath).buffer;
  return fontData;
}

function getLogo(): string {
  if (logoSvg) return logoSvg;
  const raw = readFileSync(logoPath, 'utf-8');
  logoSvg = `data:image/svg+xml,${encodeURIComponent(raw)}`;
  return logoSvg;
}

function getSparkle(): string {
  if (sparkleSvg) return sparkleSvg;
  const raw = readFileSync(sparklePath, 'utf-8');
  sparkleSvg = `data:image/svg+xml,${encodeURIComponent(raw)}`;
  return sparkleSvg;
}

export async function generateOgImage(title: string, slug: string): Promise<string> {
  mkdirSync(OG_DIR, { recursive: true });

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          padding: '60px 80px',
          background: 'linear-gradient(145deg, #0f1a14 0%, #1a2a20 30%, #1a1a2a 70%, #141420 100%)',
        },
        children: [
          // Logo + site name
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '20px' },
              children: [
                {
                  type: 'img',
                  props: { src: getLogo(), width: 64, height: 64 },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '42px', color: '#6ec9a8', fontWeight: 700 },
                    children: 'gkoreli.com',
                  },
                },
              ],
            },
          },
          // Separator with sparkle
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '14px', width: '400px' },
              children: [
                { type: 'div', props: { style: { flex: 1, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(110, 201, 168, 0.4))' } } },
                { type: 'img', props: { src: getSparkle(), width: 18, height: 18 } },
                { type: 'div', props: { style: { flex: 1, height: '2px', background: 'linear-gradient(90deg, rgba(110, 201, 168, 0.4), transparent)' } } },
              ],
            },
          },
          // Title
          {
            type: 'div',
            props: {
              style: {
                fontSize: '64px',
                fontWeight: 700,
                color: '#e0ddd5',
                lineHeight: 1.15,
                textAlign: 'center',
              },
              children: title,
            },
          },
          // Tagline
          {
            type: 'div',
            props: {
              style: { fontSize: '26px', color: '#9a9589', textAlign: 'center' },
              children: 'Where excitement ends, depth begins.',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Lora', data: getFont(), weight: 700, style: 'normal' as const },
      ],
    },
  );

  const resvg = new Resvg(svg);
  const png = resvg.render().asPng();
  const filename = `${slug}.png`;
  writeFileSync(join(OG_DIR, filename), png);
  return `/og/${filename}`;
}
