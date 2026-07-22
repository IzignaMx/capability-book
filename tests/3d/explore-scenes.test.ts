// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CAPABILITY_ORBITS,
  resolveCapabilityOrbitTransforms
} from "../../src/3d/scenes/CapabilityOrbitScene";
import { resolveHeroSignalState } from "../../src/3d/scenes/HeroSignalScene";
import {
  composeSceneProgress,
  createExploreEvent
} from "../../src/features/explore-mode/ExploreNarrative";
import { resolveMotionControlState } from "../../src/components/accessibility/MotionControl";

const CAPABILITY_IDS = [
  "web-experiences",
  "commerce-systems",
  "ai-automation",
  "data-visualization",
  "developer-products",
  "impact-technology"
] as const;

describe("Explore cinematic scenes", () => {
  it("maps the hero timeline through signal, nodes, assembly, and six ports", () => {
    expect(resolveHeroSignalState(0)).toEqual({
      signal: 0,
      particleCollapse: 0,
      corePresence: 0,
      assembly: 0,
      energy: 0,
      connectionPorts: 0
    });

    expect(resolveHeroSignalState(0.22)).toMatchObject({
      signal: 1,
      particleCollapse: 0,
      assembly: 0,
      connectionPorts: 0
    });
    expect(resolveHeroSignalState(0.48)).toMatchObject({
      particleCollapse: 1,
      corePresence: 1,
      assembly: 0,
      connectionPorts: 0
    });
    expect(resolveHeroSignalState(0.78)).toMatchObject({
      assembly: 1,
      connectionPorts: 0
    });
    expect(resolveHeroSignalState(1)).toMatchObject({
      assembly: 1,
      energy: 1,
      connectionPorts: 1
    });
    expect(resolveHeroSignalState(Number.NaN)).toEqual(resolveHeroSignalState(0));
  });

  it("defines exactly six stable capability IDs and deterministic motion paths", () => {
    expect(CAPABILITY_ORBITS.map(({ id }) => id)).toEqual(CAPABILITY_IDS);

    const first = resolveCapabilityOrbitTransforms(0.35);
    const repeated = resolveCapabilityOrbitTransforms(0.35);
    const advanced = resolveCapabilityOrbitTransforms(0.75);

    expect(first).toEqual(repeated);
    expect(first.map(({ id }) => id)).toEqual(CAPABILITY_IDS);
    expect(first).not.toEqual(advanced);
    expect(resolveCapabilityOrbitTransforms(-1)).toEqual(
      resolveCapabilityOrbitTransforms(0)
    );
    expect(resolveCapabilityOrbitTransforms(Number.POSITIVE_INFINITY)).toEqual(
      resolveCapabilityOrbitTransforms(0)
    );
  });

  it("composes both hero chapters into one monotonic timeline", () => {
    expect(composeSceneProgress("signal", 0)).toEqual({
      chapter: "signal",
      scene: "hero-signal",
      progress: 0
    });
    expect(composeSceneProgress("signal", 1).progress).toBe(0.48);
    expect(composeSceneProgress("assembly", 0).progress).toBe(0.48);
    expect(composeSceneProgress("assembly", 1).progress).toBe(1);
    expect(composeSceneProgress("capabilities", 0.5)).toEqual({
      chapter: "capabilities",
      scene: "capability-orbits",
      progress: 0.5
    });
    expect(composeSceneProgress("quality", 0.2)).toEqual({
      chapter: "quality",
      scene: "hero-signal",
      progress: 1
    });
    expect(composeSceneProgress("uplink", 0.8)).toEqual({
      chapter: "uplink",
      scene: "hero-signal",
      progress: 1
    });
  });

  it("emits an allowlisted non-personal event shape", () => {
    expect(
      createExploreEvent(
        "capability_viewed",
        "es",
        "capability-orbits",
        "advanced-motion"
      )
    ).toEqual({
      name: "capability_viewed",
      locale: "es",
      sourceRoute: "/es/",
      sourceCapability: "capability-orbits",
      sourceConcept: "advanced-motion"
    });

    expect(Object.keys(createExploreEvent("explore_started", "en"))).toEqual([
      "name",
      "locale",
      "sourceRoute"
    ]);
  });

  it("never offers to elevate a constrained system motion policy", () => {
    expect(resolveMotionControlState(false, false)).toBe("unavailable");
    expect(resolveMotionControlState(false, true)).toBe("reduce");
    expect(resolveMotionControlState(true, false)).toBe("restore");
  });

  it("keeps every capability correlated with accessible bilingual HTML", () => {
    const pages = ["es", "en"].map((locale) =>
      readFileSync(new URL(`../../src/pages/${locale}/index.astro`, import.meta.url), "utf8")
    );

    for (const page of pages) {
      for (const capabilityId of CAPABILITY_IDS) {
        expect(page).toContain(`data-capability-id="${capabilityId}"`);
      }
    }

    const sceneSource = readFileSync(
      new URL("../../src/3d/scenes/CapabilityOrbitScene.tsx", import.meta.url),
      "utf8"
    );
    const prohibited = new RegExp(
      ["#ff" + "6a1a", "#f9" + "7316", "ora" + "nge"].join("|"),
      "i"
    );
    expect(sceneSource).not.toMatch(prohibited);
  });
});
