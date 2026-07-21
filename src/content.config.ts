import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const proofPoint = z.object({
  kind: z.enum([
    "verified-result",
    "system-metric",
    "expected-outcome",
    "demonstrated-capability"
  ]),
  label: z.string().min(2),
  value: z.string().optional(),
  description: z.string().min(10),
  sourceLabel: z.string().optional(),
  sourceUrl: z.url().optional(),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/*.md"
  }),
  schema: z.object({
    locale: z.enum(["es", "en"]),
    classification: z.enum(["real", "open-source", "internal", "concept"]),
    title: z.string().min(2),
    elevatorPitch: z.string().min(20),
    challenge: z.string().min(20),
    constraints: z.array(z.string()).min(1),
    strategy: z.string().min(20),
    solution: z.string().min(20),
    capabilities: z.array(z.string()).min(1),
    industries: z.array(z.string()).min(1),
    technologies: z.array(z.string()).min(1),
    outcomes: z.array(proofPoint).min(1),
    liveUrl: z.url().optional(),
    sourceUrl: z.url().optional(),
    fallbackPoster: z.string().startsWith("/media/projects/"),
    confidentiality: z.enum(["public", "partial", "private"]),
    accessibilityNotes: z.array(z.string()).min(1),
    relatedServices: z.array(z.string()).min(1),
    ctaPreset: z.string().min(2)
  })
});

const capabilities = defineCollection({
  loader: glob({
    base: "./src/content/capabilities",
    pattern: "**/*.json"
  }),
  schema: z.object({
    locale: z.enum(["es", "en"]),
    name: z.string().min(2),
    description: z.string().min(20),
    technicalScope: z.array(z.string()).min(1),
    suitableIndustries: z.array(z.string()).min(1),
    commonOutcomes: z.array(z.string()).min(1),
    ctaContext: z.string().min(2),
    sceneId: z.string().min(2),
    fallbackPoster: z.string().startsWith("/media/")
  })
});

export const collections = { projects, capabilities };
