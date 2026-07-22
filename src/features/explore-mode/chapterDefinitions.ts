export const chapters = [
  { id: "signal", sceneId: "hero-signal", label: "Signal acquisition" },
  { id: "assembly", sceneId: "hero-signal", label: "System assembly" },
  {
    id: "capabilities",
    sceneId: "capability-orbits",
    label: "Capability expansion",
  },
  { id: "omnisync", sceneId: "omnisync", label: "OmniSync encounter" },
  {
    id: "nomada",
    sceneId: "nomada",
    label: "Hamburguesa Nómada encounter",
  },
  { id: "quality", sceneId: "hero-signal", label: "Quality scan" },
  {
    id: "uplink",
    sceneId: "hero-signal",
    label: "Communication uplink",
  },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];
