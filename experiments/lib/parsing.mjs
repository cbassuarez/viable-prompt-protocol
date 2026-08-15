// Shared VPP message parsing for experiment runners.
//
// Previously parseFooter + parseAssistantMessage were copy-pasted into every
// run-*.mjs. They now live here once. parseFirstLine remains the single source
// of truth in scripts/parse-first-line.mjs and is re-exported for convenience.

import { parseFirstLine } from "../../scripts/parse-first-line.mjs";

export { parseFirstLine };

// Parse a compliance footer line of the form:
//   [Version=v1.4 | Tag=o_1 | Sources=none | Assumptions=2 | Cycle=1/3 | Locus=name]
// Returns a structured object, or null if there is no footer, or { raw } on a
// malformed footer (so callers can still see what the model emitted).
export function parseFooter(footerLine) {
  if (!footerLine) return null;
  const trimmed = footerLine.trim();
  if (!trimmed) return null;
  try {
    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
      throw new Error("footer-missing-brackets");
    }
    const inner = trimmed.slice(1, -1);
    const parts = inner.split("|").map((part) => part.trim());
    const parsed = {};
    for (const part of parts) {
      const [keyRaw, ...rest] = part.split("=");
      if (!keyRaw || rest.length === 0) continue;
      const key = keyRaw.toLowerCase();
      const value = rest.join("=").trim();
      switch (key) {
        case "version":
          parsed.version = value;
          break;
        case "tag":
          parsed.tag_id = value;
          break;
        case "sources":
          parsed.sources = value;
          break;
        case "assumptions": {
          const n = Number.parseInt(value, 10);
          parsed.assumptions = Number.isNaN(n) ? null : n;
          break;
        }
        case "cycle": {
          const [cycleCurrent, cycleMax] = value.split("/").map((v) => v && v.trim());
          const cycle = Number.parseInt(cycleCurrent, 10);
          const cycleMaxNum = Number.parseInt(cycleMax, 10);
          parsed.cycle = Number.isNaN(cycle) ? null : cycle;
          parsed.cycle_max = Number.isNaN(cycleMaxNum) ? null : cycleMaxNum;
          break;
        }
        case "locus":
          parsed.locus = value;
          break;
        default: {
          if (!parsed.extras) parsed.extras = {};
          parsed.extras[key] = value;
        }
      }
    }
    parsed.raw = footerLine;
    return parsed;
  } catch (err) {
    console.warn("Failed to parse footer:", footerLine, err.message);
    return { raw: footerLine };
  }
}

// Split an assistant message into { raw_header, tag, modifiers, body, footer,
// parsed_footer }. The first non-empty line is treated as the tag header and the
// last as the compliance footer; everything between is the body.
export function parseAssistantMessage(text) {
  const sourceText = typeof text === "string" ? text : "";
  const lines = sourceText.split(/\r?\n/).map((line) => line.trim());
  while (lines.length && lines[0] === "") lines.shift();
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  if (lines.length < 2) {
    return {
      raw_header: null,
      tag: null,
      modifiers: [],
      body: sourceText.trim(),
      footer: null,
      parsed_footer: null
    };
  }

  const raw_header = lines[0];
  const footer = lines[lines.length - 1];
  const body = lines.slice(1, -1).join("\n").trim();

  let tag = null;
  let modifiers = [];
  if (raw_header) {
    const parsed = parseFirstLine(raw_header);
    if (parsed && typeof parsed.tag === "string") tag = parsed.tag;
    if (parsed && Array.isArray(parsed.mods)) modifiers = parsed.mods;

    // Fallback: assistant-style headers like "<g>", "<o>", "<c>", "<o_f>".
    if (!tag) {
      const m = raw_header.match(/^<([a-z_]+)>$/i);
      if (m) tag = m[1];
    }
  }

  modifiers = Array.isArray(modifiers)
    ? modifiers.filter((mod) => typeof mod === "string" && mod.length > 0)
    : [];

  return { raw_header, tag, modifiers, body, footer, parsed_footer: parseFooter(footer) };
}
