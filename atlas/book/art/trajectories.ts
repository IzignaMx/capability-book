/** Editorial signatures reuse the case studies; they do not encode measured topology. */
type Signature = readonly [string, string, string];
const signatures: Readonly<Record<string, Signature>> = {
  'distrito-cero': ['M42 224 L120 224 L120 140 L280 140', 'M42 66 L170 66 L170 140 L280 140', 'M280 140 L364 140 L364 66 L464 66'],
  nexo: ['M42 82 C146 268 224 260 280 140', 'M42 224 C170 30 206 22 280 140', 'M280 140 C328 242 460 190 458 80'],
  omnisync: ['M44 146 C112 24 236 26 280 136', 'M60 235 C118 178 222 226 280 136', 'M280 136 C330 64 405 66 452 150'],
  'hamburguesa-nomada': ['M40 204 C122 266 216 42 280 144', 'M68 60 C142 4 206 249 280 144', 'M280 144 C347 34 414 72 464 128'],
  tecuiyo: ['M40 80 L162 80 L162 142 L280 142', 'M40 232 L112 232 L112 142 L280 142', 'M280 142 L354 142 L354 78 L464 78'],
  vald: ['M42 220 C96 208 105 76 159 103 S216 217 280 146', 'M45 61 C125 158 164 21 280 146', 'M280 146 C334 252 413 64 465 111'],
  nutrichilango: ['M50 55 C50 151 192 213 280 142', 'M50 233 C51 117 218 39 280 142', 'M280 142 C362 63 428 72 462 154'],
  'developer-tools': ['M40 70 L130 70 L197 142 L280 142', 'M40 231 L130 231 L197 142 L280 142', 'M280 142 L347 72 L461 72'],
};

export function projectSignature(slug: string): Signature {
  return Object.hasOwn(signatures, slug) ? signatures[slug]! : signatures.omnisync!;
}

const phases = ['matter', 'trajectory', 'weave', 'constellation'] as const;
export type AtlasPhaseName = typeof phases[number];
export type AtlasPhase = { index: 0 | 1 | 2 | 3; name: AtlasPhaseName; progress: number };

/** Return total reading progress and its quarter, including a safe static initial state. */
export function atlasPhase(progress: number): AtlasPhase {
  const safe = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : progress === Infinity ? 1 : 0;
  const index = Math.min(3, Math.floor(safe * 4)) as AtlasPhase['index'];
  return { index, name: phases[index], progress: safe };
}
