import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const canvasHarness = vi.hoisted(() => ({
  ready: true,
  renders: vi.fn()
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({
    children,
    fallback,
    onCreated,
    role,
    "aria-label": ariaLabel
  }: {
    readonly children?: ReactNode;
    readonly fallback?: ReactNode;
    readonly onCreated?: () => void;
    readonly role?: string;
    readonly "aria-label"?: string;
  }) => {
    canvasHarness.renders();
    if (canvasHarness.ready) onCreated?.();

    return (
      <div data-testid="r3f-canvas" role={role} aria-label={ariaLabel}>
        {children}
        <div data-testid="canvas-alternate-content">{fallback}</div>
      </div>
    );
  }
}));

import { ExploreCanvas } from "../src/components/explore/ExploreCanvas";

describe("ExploreCanvas", () => {
  beforeEach(() => {
    canvasHarness.ready = true;
    canvasHarness.renders.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not treat mounted canvas alternate content as a WebGL failure", async () => {
    vi.useFakeTimers();
    render(
      <ExploreCanvas
        motionLevel={3}
        quality="high"
        poster="/media/explore/hero.avif"
        fallbackLabel="Static fallback"
      >
        <span>Spatial scene</span>
      </ExploreCanvas>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Visualización espacial de capacidades de IzignaMx"
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Spatial scene")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-alternate-content")).toBeInTheDocument();
    expect(canvasHarness.renders).toHaveBeenCalledTimes(1);
  });

  it("retries once before exposing the terminal DOM fallback", async () => {
    vi.useFakeTimers();
    canvasHarness.ready = false;

    render(
      <ExploreCanvas
        motionLevel={3}
        quality="high"
        poster="/media/explore/hero.avif"
        fallbackLabel="Static fallback"
      />
    );

    expect(canvasHarness.renders).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(canvasHarness.renders).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(screen.queryByTestId("r3f-canvas")).not.toBeInTheDocument();
    expect(screen.getByText("Static fallback")).toBeInTheDocument();
  });

  it("renders only the ordinary DOM fallback for static motion levels", () => {
    render(
      <ExploreCanvas
        motionLevel={1}
        quality="low"
        poster="/media/explore/hero.avif"
        fallbackLabel="Static fallback"
      />
    );

    expect(screen.queryByTestId("r3f-canvas")).not.toBeInTheDocument();
    expect(screen.getByText("Static fallback")).toBeInTheDocument();
  });
});
