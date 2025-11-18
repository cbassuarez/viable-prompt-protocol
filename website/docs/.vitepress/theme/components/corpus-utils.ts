export type CorpusTag = 'g' | 'q' | 'o' | 'c' | 'o_f';
export type CorpusMode = 'happy' | 'failure' | 'edge';
export type CorpusCorrectness = 'correct' | 'incorrect';
export type CorpusSeverity = 'minor' | 'major' | null;

export interface RawCorpusEntry {
  id?: string;
  version?: string;
  tag?: CorpusTag;
  mode?: CorpusMode;
  correctness?: CorpusCorrectness;
  severity?: CorpusSeverity;
  title?: string;
  summary?: string;
  ruleIds?: string[];
  filePath?: string;
  userText?: string;
  assistantText?: string;
  notes?: string | null;
  experiment?: string;
  experimentSlug?: string;
  experimentLabel?: string;
  meta?: Record<string, unknown> | null;
}

export interface CorpusEntry {
  id: string;
  version: string;
  tag: CorpusTag;
  mode: CorpusMode;
  correctness: CorpusCorrectness;
  severity: CorpusSeverity;
  title: string;
  summary: string;
  ruleIds: string[];
  filePath: string;
  userText: string;
  assistantText: string;
  notes?: string | null;
  experimentSlug: string;
  experimentLabel: string;
}

export interface FilterState {
  tags: Set<CorpusTag>;
  correctness: Set<CorpusCorrectness>;
  severities: Set<Exclude<CorpusSeverity, null>>;
  modes: Set<CorpusMode>;
  searchQuery: string;
  experiment: ExperimentFilterState;
}

export type ExperimentFilterState = 'all' | string;

export const TAG_ORDER: CorpusTag[] = ['g', 'q', 'o', 'c', 'o_f'];
export const MODE_ORDER: CorpusMode[] = ['failure', 'edge', 'happy'];
export const TAG_LABELS: Record<CorpusTag, string> = {
  g: 'Gather',
  q: 'Question',
  o: 'Output',
  c: 'Critique',
  o_f: 'Final'
};

export const RULE_LABELS: Record<string, string> = {
  mirror_tag: 'Mirror tag header',
  footer_present: 'Footer present',
  footer_cycle: 'Cycle count matches',
  footer_version: 'Version is declared',
  footer_sources: 'Sources enumerated',
  footer_locus: 'Locus provided',
  injection_resistance: 'Injection resisted',
  marketing_deflection: 'Deflected marketing pivot',
  query_grounding: 'Clarifies tag rules',
  finalization: 'Finalized deliverable',
  critique_scope: 'Critique stays scoped',
  restart_rejection: 'Rejects restart',
  header_missing: 'Missing header'
};

export function mapRawEntry(raw: RawCorpusEntry, fallbackVersion = 'v1.4'): CorpusEntry {
  const experiment = normalizeExperiment(raw);
  return {
    id: raw.id ?? cryptoRandomId(),
    version: raw.version ?? fallbackVersion,
    tag: raw.tag ?? 'g',
    mode: raw.mode ?? 'happy',
    correctness: raw.correctness ?? 'correct',
    severity: raw.severity ?? null,
    title: raw.title ?? 'Untitled example',
    summary: raw.summary ?? 'No summary provided.',
    ruleIds: raw.ruleIds ?? [],
    filePath: raw.filePath ?? '',
    userText: raw.userText ?? '',
    assistantText: raw.assistantText ?? '',
    notes: raw.notes ?? null,
    experimentSlug: experiment.slug,
    experimentLabel: experiment.label
  };
}

export function filterEntries(entries: CorpusEntry[], state: FilterState): CorpusEntry[] {
  const query = state.searchQuery.trim().toLowerCase();
  return entries.filter((entry) => {
    if (state.experiment !== 'all' && entry.experimentSlug !== state.experiment) {
      return false;
    }

    if (!state.tags.has(entry.tag)) {
      return false;
    }

    if (!state.correctness.has(entry.correctness)) {
      return false;
    }

    if (state.severities.size > 0) {
      if (entry.severity === null) {
        return false;
      }
      if (!state.severities.has(entry.severity)) {
        return false;
      }
    }

    if (!state.modes.has(entry.mode)) {
      return false;
    }

    if (query.length > 0) {
      const haystack = [
        entry.title,
        entry.summary,
        entry.userText,
        entry.assistantText,
        entry.notes ?? ''
      ]
        .join('\n')
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export function sortEntries(entries: CorpusEntry[]): CorpusEntry[] {
  const tagOrder = new Map(TAG_ORDER.map((tag, index) => [tag, index] as const));
  const modeOrder = new Map(MODE_ORDER.map((mode, index) => [mode, index] as const));

  return [...entries].sort((a, b) => {
    const modeDiff = (modeOrder.get(a.mode) ?? 0) - (modeOrder.get(b.mode) ?? 0);
    if (modeDiff !== 0) return modeDiff;

    const tagDiff = (tagOrder.get(a.tag) ?? 0) - (tagOrder.get(b.tag) ?? 0);
    if (tagDiff !== 0) return tagDiff;

    return a.id.localeCompare(b.id, 'en', { numeric: true });
  });
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `entry-${Math.random().toString(36).slice(2)}`;
}

interface ExperimentInfo {
  slug: string;
  label: string;
}

function normalizeExperiment(raw: RawCorpusEntry): ExperimentInfo {
  const meta = (typeof raw.meta === 'object' && raw.meta !== null ? raw.meta : {}) as Record<string, unknown>;
  const metaExperiment = pickString(meta['experimentSlug']) || pickString(meta['experiment']) || pickString(meta['experimentId']);
  const metaLabel = pickString(raw.experimentLabel) || pickString(meta['experimentLabel']) || pickString(meta['experimentName']);

  const rawSlug =
    pickString(raw.experimentSlug) ||
    pickString(raw.experiment) ||
    metaExperiment ||
    extractExperimentSlug(raw.filePath) ||
    extractExperimentSlug(raw.id) ||
    'general';

  const slug = normalizeExperimentSlug(String(rawSlug));
  const label = deriveExperimentLabel(slug, metaLabel);
  return { slug, label };
}

function extractExperimentSlug(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/(exp[-_ ]?\d{1,3}(?:[-_][a-z0-9]+)?)/i);
  if (match) {
    return match[1];
  }
  const folderMatch = value.match(/experiments\/(.+?)(?:\/|$)/i);
  if (folderMatch) {
    return folderMatch[1];
  }
  return null;
}

function normalizeExperimentSlug(slug: string): string {
  const cleaned = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_\s]/g, '')
    .replace(/\s+/g, '-');
  return cleaned || 'general';
}

export function deriveExperimentLabel(slug: string, hint?: string | null): string {
  const normalizedSlug = slug.trim();
  const hintText = hint?.trim();
  const numberedMatch = normalizedSlug.match(/^exp[-_ ]?(\d+)(?:[-_](.+))?$/i);
  if (numberedMatch) {
    const digits = numberedMatch[1].padStart(2, '0');
    const suffix = hintText ?? numberedMatch[2]?.replace(/[-_]/g, ' ');
    if (suffix && suffix.length > 0) {
      return `Experiment ${digits}: ${titleCase(suffix)}`;
    }
    return `Experiment ${digits}`;
  }

  const base = hintText ?? normalizedSlug.replace(/[-_]/g, ' ');
  return titleCase(base);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function pickString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}
