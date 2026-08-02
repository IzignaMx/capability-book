export const captureChallengeMarkers = [
  "verify you are human",
  "performing security verification",
  "attention required",
  "cloudflare ray id"
] as const;

export type CaptureChallengeMarker = (typeof captureChallengeMarkers)[number];

export function detectCaptureChallenge(bodyText: string): CaptureChallengeMarker | null {
  const normalized = bodyText.toLowerCase();
  return captureChallengeMarkers.find((marker) => normalized.includes(marker)) ?? null;
}
