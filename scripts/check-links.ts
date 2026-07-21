import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const GET_FALLBACK_STATUSES = new Set([403, 405, 501]);
const TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 2;

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [first, second] = parts;
  if (first === undefined || second === undefined) return false;

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export function isAllowedPublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      hostname !== "localhost" &&
      hostname !== "[::1]" &&
      hostname !== "::1" &&
      !hostname.endsWith(".local") &&
      !isPrivateIpv4(hostname)
    );
  } catch {
    return false;
  }
}

async function request(url: string, method: "HEAD" | "GET"): Promise<number> {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "IzignaMx-Capability-Book-Link-Check/1.0"
    }
  });

  if (method === "GET") {
    await response.body?.cancel();
  }

  return response.status;
}

async function probe(url: string): Promise<number> {
  let status = await request(url, "HEAD");
  if (GET_FALLBACK_STATUSES.has(status)) {
    status = await request(url, "GET");
  }
  return status;
}

async function verify(url: string): Promise<number> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const status = await probe(url);
      if (!RETRYABLE_STATUSES.has(status) || attempt === MAX_ATTEMPTS) {
        return status;
      }
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Unable to verify ${url}`);
}

type EvidenceLink = {
  url: string;
  public: boolean;
};

type EvidenceRecord = {
  links: EvidenceLink[];
};

async function main(): Promise<void> {
  const directory = new URL("../data/evidence/", import.meta.url);
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".json"))
    .sort();
  const urls = new Set<string>();

  for (const file of files) {
    const record = JSON.parse(
      await readFile(new URL(file, directory), "utf8")
    ) as EvidenceRecord;
    for (const link of record.links) {
      if (link.public) urls.add(link.url);
    }
  }

  for (const url of [...urls].sort()) {
    if (!isAllowedPublicUrl(url)) {
      throw new Error(`Disallowed public URL: ${url}`);
    }

    const status = await verify(url);
    if (status >= 400) {
      throw new Error(`${url} returned HTTP ${status}`);
    }
    console.log(`${status} ${url}`);
  }
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPoint === fileURLToPath(import.meta.url)) {
  await main();
}
