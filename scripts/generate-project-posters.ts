import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

interface PosterDefinition {
  slug: string;
  title: string;
  index: string;
  accent: string;
  secondary: string;
  signal: string;
}

const posters: PosterDefinition[] = [
  {
    slug: "developer-tools",
    title: "DEVELOPER TOOLS",
    index: "01",
    accent: "#60a5fa",
    secondary: "#22d3ee",
    signal: "OPEN SYSTEMS / PRODUCTIVITY"
  },
  {
    slug: "hamburguesa-nomada",
    title: "HAMBURGUESA NOMADA",
    index: "02",
    accent: "#22d3ee",
    secondary: "#00b4c0",
    signal: "COMMUNITY / EXPERIENCE"
  },
  {
    slug: "nutrichilango",
    title: "NUTRICHILANGO",
    index: "03",
    accent: "#00b4c0",
    secondary: "#3b82f6",
    signal: "DATA / INFORMED CHOICE"
  },
  {
    slug: "omnisync",
    title: "OMNISYNC",
    index: "04",
    accent: "#3b82f6",
    secondary: "#22d3ee",
    signal: "COMMERCE / ORCHESTRATION"
  },
  {
    slug: "tecuiyo",
    title: "TECUIYO",
    index: "05",
    accent: "#60a5fa",
    secondary: "#00b4c0",
    signal: "CIVIC TECH / ACCESS"
  },
  {
    slug: "vald",
    title: "VALD",
    index: "06",
    accent: "#22d3ee",
    secondary: "#3b82f6",
    signal: "ENDURANCE / STORY"
  }
];

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function posterSvg(poster: PosterDefinition): string {
  const title = escapeXml(poster.title);
  const signal = escapeXml(poster.signal);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#020617"/>
          <stop offset="1" stop-color="#0b1120"/>
        </linearGradient>
        <radialGradient id="glow" cx="78%" cy="18%" r="70%">
          <stop offset="0" stop-color="${poster.accent}" stop-opacity=".42"/>
          <stop offset="1" stop-color="${poster.accent}" stop-opacity="0"/>
        </radialGradient>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" fill="none" stroke="#94a3b8" stroke-opacity=".12"/>
        </pattern>
      </defs>
      <rect width="1280" height="720" fill="url(#surface)"/>
      <rect width="1280" height="720" fill="url(#glow)"/>
      <rect width="1280" height="720" fill="url(#grid)"/>
      <path d="M790 88 1170 308 790 528 410 308Z" fill="none" stroke="${poster.accent}" stroke-width="2" stroke-opacity=".72"/>
      <path d="M866 132 1094 264 866 396 638 264Z" fill="${poster.secondary}" fill-opacity=".08" stroke="${poster.secondary}" stroke-width="2"/>
      <circle cx="866" cy="264" r="14" fill="${poster.secondary}"/>
      <path d="M90 94H330" stroke="${poster.accent}" stroke-width="8"/>
      <text x="90" y="160" fill="#cbd5e1" font-family="monospace" font-size="24" letter-spacing="6">IZIGNAMX / ${poster.index}</text>
      <text x="90" y="530" fill="#ffffff" font-family="Arial, sans-serif" font-size="70" font-weight="700" letter-spacing="-2">${title}</text>
      <text x="94" y="584" fill="${poster.secondary}" font-family="monospace" font-size="20" letter-spacing="4">${signal}</text>
      <text x="1110" y="646" fill="#cbd5e1" font-family="monospace" font-size="18">CASE_${poster.index}</text>
    </svg>
  `;
}

async function generatePoster(poster: PosterDefinition): Promise<void> {
  const outputDirectory = resolve("public", "media", "projects", poster.slug);
  const outputPath = resolve(outputDirectory, "poster.avif");
  await mkdir(outputDirectory, { recursive: true });
  await sharp(Buffer.from(posterSvg(poster)))
    .avif({ quality: 72, effort: 6 })
    .toFile(outputPath);
}

await Promise.all(posters.map(generatePoster));
console.log(`Generated ${posters.length} project fallback posters.`);
