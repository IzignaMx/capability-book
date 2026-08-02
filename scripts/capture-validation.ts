export const captureChallengeMarkers = [
  "verify you are human",
  "performing security verification",
  "attention required",
  "cloudflare ray id"
] as const;

export type CaptureChallengeMarker = (typeof captureChallengeMarkers)[number];

const blockedHttpStatuses = [401, 403, 429, 503] as const;

export type CaptureHttpBlockMarker = `http-${(typeof blockedHttpStatuses)[number]}`;
export type CaptureBlockMarker = CaptureChallengeMarker | CaptureHttpBlockMarker;

export function detectCaptureChallenge(bodyText: string): CaptureChallengeMarker | null {
  const normalized = bodyText.toLowerCase();
  return captureChallengeMarkers.find((marker) => normalized.includes(marker)) ?? null;
}

export function detectCaptureBlock(bodyText: string, httpStatus?: number): CaptureBlockMarker | null {
  const challenge = detectCaptureChallenge(bodyText);
  if (challenge) return challenge;
  if (!blockedHttpStatuses.some((status) => status === httpStatus)) return null;
  return `http-${httpStatus}` as CaptureHttpBlockMarker;
}

export function hasCaptureSourceDrift(actualHash: string, reviewedSourceHash: string): boolean {
  return actualHash !== reviewedSourceHash;
}
