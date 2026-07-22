import { useCallback, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  RenderQualityController,
  type QualityProfile
} from "./RenderQualityController";
import { FRAME_SAMPLE_WINDOW_SIZE, FrameSampler } from "./frameSampler";

const DPR_BY_QUALITY: Readonly<Record<QualityProfile, number>> = {
  low: 1,
  medium: 1.75,
  high: 2
};

const TEST_HOOKS_ENABLED = import.meta.env.PUBLIC_ENABLE_TEST_HOOKS === "true";

interface QualityTestHook {
  readonly pushFrame: (milliseconds: number) => void;
  readonly pushWindow: (milliseconds: number) => void;
  readonly profile: () => QualityProfile;
}

interface QualityTestWindow extends Window {
  __IZIGNA_QUALITY_TEST__?: QualityTestHook;
}

export interface AdaptiveQualityProbeProps {
  readonly initialQuality: QualityProfile;
  readonly onQualityChange: (quality: QualityProfile) => void;
}

function resolvedDevicePixelRatio(): number {
  const ratio = window.devicePixelRatio;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}

function isValidFrameDuration(milliseconds: number): boolean {
  return Number.isFinite(milliseconds) && milliseconds >= 0;
}

export function AdaptiveQualityProbe({
  initialQuality,
  onQualityChange
}: AdaptiveQualityProbeProps): null {
  const invalidate = useThree((state) => state.invalidate);
  const setDpr = useThree((state) => state.setDpr);
  const renderer = useThree((state) => state.gl);
  const controllerRef = useRef(new RenderQualityController(initialQuality));
  const samplerRef = useRef(new FrameSampler());
  const calibratingRef = useRef(true);
  const skipNextFrameRef = useRef(true);

  const startCalibration = useCallback(() => {
    samplerRef.current.reset();
    calibratingRef.current = true;
    skipNextFrameRef.current = true;
    invalidate();
  }, [invalidate]);

  const pushFrame = useCallback(
    (milliseconds: number) => {
      if (!isValidFrameDuration(milliseconds)) return;

      const average = samplerRef.current.push(milliseconds);
      if (average === null) return;

      const previousQuality = controllerRef.current.profile;
      const nextQuality = controllerRef.current.observeAverageFrameTime(average);

      if (nextQuality === previousQuality) {
        calibratingRef.current = false;
        return;
      }

      const targetDpr = Math.min(resolvedDevicePixelRatio(), DPR_BY_QUALITY[nextQuality]);
      setDpr(targetDpr);
      onQualityChange(nextQuality);
      startCalibration();
    },
    [onQualityChange, setDpr, startCalibration]
  );

  useEffect(() => {
    if (controllerRef.current.profile === initialQuality) return;
    controllerRef.current = new RenderQualityController(initialQuality);
    startCalibration();
  }, [initialQuality, startCalibration]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      samplerRef.current.reset();
      skipNextFrameRef.current = true;

      if (document.hidden) {
        calibratingRef.current = false;
        return;
      }

      startCalibration();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [startCalibration]);

  useEffect(() => {
    const canvas = renderer.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      samplerRef.current.reset();
      calibratingRef.current = false;
      skipNextFrameRef.current = true;
    };

    const handleContextRestored = () => startCalibration();

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [renderer, startCalibration]);

  useEffect(() => {
    if (!TEST_HOOKS_ENABLED) return;

    const target = window as QualityTestWindow;
    const hook: QualityTestHook = {
      pushFrame,
      pushWindow(milliseconds) {
        samplerRef.current.reset();
        for (let index = 0; index < FRAME_SAMPLE_WINDOW_SIZE; index += 1) {
          pushFrame(milliseconds);
        }
      },
      profile: () => controllerRef.current.profile
    };

    target.__IZIGNA_QUALITY_TEST__ = hook;
    return () => {
      if (target.__IZIGNA_QUALITY_TEST__ === hook) {
        delete target.__IZIGNA_QUALITY_TEST__;
      }
    };
  }, [pushFrame]);

  useFrame((_state, deltaSeconds) => {
    if (!calibratingRef.current || document.hidden) return;

    if (skipNextFrameRef.current) {
      skipNextFrameRef.current = false;
      invalidate();
      return;
    }

    pushFrame(deltaSeconds * 1_000);
    if (calibratingRef.current) invalidate();
  });

  return null;
}
