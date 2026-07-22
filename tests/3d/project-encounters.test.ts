// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  NOMADA_CHECKPOINTS,
  resolveNomadaRoutePoints,
  resolveNomadaSceneState
} from "../../src/3d/scenes/NomadaScene";
import {
  OMNISYNC_CHANNELS,
  resolveOmniSyncSceneState
} from "../../src/3d/scenes/OmniSyncScene";
import {
  composeSceneProgress,
  createExploreEvent
} from "../../src/features/explore-mode/ExploreNarrative";

describe("Flagship project encounters", () => {
  it("models four stable OmniSync channels with a two-satellite low profile", () => {
    expect(OMNISYNC_CHANNELS.map(({ id }) => id)).toEqual([
      "storefront",
      "marketplace",
      "fulfillment",
      "operations"
    ]);

    const lowStart = resolveOmniSyncSceneState(0.25, "low");
    const lowEnd = resolveOmniSyncSceneState(0.75, "low");
    const medium = resolveOmniSyncSceneState(0.75, "medium");
    const high = resolveOmniSyncSceneState(1, "high");

    expect(lowStart.visibleChannelIds).toEqual(["storefront", "marketplace"]);
    expect(lowEnd.visibleChannelIds).toEqual(["fulfillment", "operations"]);
    expect(lowStart.quality).toMatchObject({ satelliteCount: 2, trails: false, glow: false });
    expect(medium.visibleChannelIds).toHaveLength(4);
    expect(medium.quality).toMatchObject({ satelliteCount: 4, trails: true, glow: true });
    expect(high.quality.queueParticles).toBeGreaterThan(0);
  });

  it("keeps the price pulse behind its shield while stock reaches every visible channel", () => {
    const protectedState = resolveOmniSyncSceneState(0.72, "high");

    expect(protectedState.stockPulse).toBe(1);
    expect(protectedState.pricePulse).toBeLessThanOrEqual(0.34);
    expect(protectedState.pricePulse).toBeLessThan(protectedState.stockPulse);
    expect(protectedState.visibleChannelIds).toHaveLength(4);
    expect(resolveOmniSyncSceneState(Number.NaN, "low")).toEqual(
      resolveOmniSyncSceneState(0, "low")
    );
  });

  it("resolves the Nómada route into bounded checkpoints and a recognition card", () => {
    const start = resolveNomadaSceneState(0, "low");
    const medium = resolveNomadaSceneState(0.7, "medium");
    const finish = resolveNomadaSceneState(1, "high");

    expect(start).toMatchObject({ route: 0, visibleCheckpoints: 0, card: 0 });
    expect(medium.visibleCheckpoints).toBeLessThanOrEqual(6);
    expect(medium.posterTexture).toBe(true);
    expect(finish).toMatchObject({
      route: 1,
      visibleCheckpoints: NOMADA_CHECKPOINTS.length,
      resultSignal: 1,
      card: 1,
      posterTexture: true
    });
  });

  it("generates deterministic progressive route geometry", () => {
    const first = resolveNomadaRoutePoints(0.45, 40);
    const repeated = resolveNomadaRoutePoints(0.45, 40);
    const advanced = resolveNomadaRoutePoints(0.8, 40);

    expect(first).toEqual(repeated);
    expect(first.length).toBeGreaterThan(2);
    expect(advanced.length).toBeGreaterThan(first.length);
    expect(resolveNomadaRoutePoints(-1, 40)).toHaveLength(2);
    expect(resolveNomadaRoutePoints(Number.POSITIVE_INFINITY, 40)).toHaveLength(2);
  });

  it("maps project chapters directly and emits allowlisted project events", () => {
    expect(composeSceneProgress("omnisync", 0.42)).toEqual({
      chapter: "omnisync",
      scene: "omnisync",
      progress: 0.42
    });
    expect(composeSceneProgress("nomada", 0.68)).toEqual({
      chapter: "nomada",
      scene: "nomada",
      progress: 0.68
    });
    expect(
      createExploreEvent(
        "project_scene_engaged",
        "en",
        undefined,
        undefined,
        "hamburguesa-nomada"
      )
    ).toEqual({
      name: "project_scene_engaged",
      locale: "en",
      sourceRoute: "/en/",
      sourceProject: "hamburguesa-nomada"
    });
  });

  it("retains literal deferred imports and bilingual semantic encounters", () => {
    const narrative = readFileSync(
      new URL("../../src/features/explore-mode/ExploreNarrative.tsx", import.meta.url),
      "utf8"
    );
    const pages = ["es", "en"].map((locale) =>
      readFileSync(new URL(`../../src/pages/${locale}/index.astro`, import.meta.url), "utf8")
    );

    expect(narrative).toContain('import("../../3d/scenes/OmniSyncScene")');
    expect(narrative).toContain('import("../../3d/scenes/NomadaScene")');
    for (const page of pages) {
      expect(page).toContain('chapterId="omnisync"');
      expect(page).toContain('chapterId="nomada"');
    }
  });

  it("keeps both encounter scenes inside the approved cool identity", () => {
    const source = ["OmniSyncScene", "NomadaScene"]
      .map((name) =>
        readFileSync(new URL(`../../src/3d/scenes/${name}.tsx`, import.meta.url), "utf8")
      )
      .join("\n");
    const prohibited = new RegExp(
      ["#ff" + "6a1a", "#f9" + "7316", "ora" + "nge"].join("|"),
      "i"
    );

    expect(source).not.toMatch(prohibited);
  });
});
