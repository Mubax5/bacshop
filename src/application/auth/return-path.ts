const FALLBACK_RETURN_PATH = "/account";

/** Keep redirects on a local, absolute app path; reject protocol-relative and encoded path tricks. */
export function validateReturnPath(candidate: string | null | undefined, fallback = FALLBACK_RETURN_PATH): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(candidate) || /%2f|%5c/i.test(candidate)) return fallback;
  try {
    const parsed = new URL(candidate, "https://bacshop.local");
    if (parsed.origin !== "https://bacshop.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
