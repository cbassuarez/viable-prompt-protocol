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
  correctness: CorpusCorrectness | 'all';
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

export function mapRawEntry(raw: RawCorpusEntry, version: string): CorpusEntry {
  const experiment = normalizeExperiment(raw);
  return {
    id: raw.id ?? cryptoRandomId(),
    version,
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
  const hasTagFilter = state.tags.size > 0;
  const hasModeFilter = state.modes.size > 0;
  const hasSeverityFilter = state.severities.size > 0;

  return entries.filter((entry) => {
    if (state.experiment !== 'all' && entry.experimentSlug !== state.experiment) {
      return false;
    }

    if (hasTagFilter && !state.tags.has(entry.tag)) {
      return false;
    }

    if (state.correctness !== 'all' && entry.correctness !== state.correctness) {
      return false;
    }

    if (hasSeverityFilter && entry.severity !== null && !state.severities.has(entry.severity)) {
      return false;
    }

    if (hasModeFilter && !state.modes.has(entry.mode)) {
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
  const metaExperiment =
    pickString(meta['experimentSlug']) ||
    pickString(meta['experiment']) ||
    pickString(meta['experimentId']) ||
    pickString(meta['experiment_id']) ||
    pickString(meta['task_template_id']) ||
    pickString(meta['taskTemplateId']) ||
    pickString(meta['task_template']) ||
    pickString(meta['taskTemplate']);
  const metaLabel =
    pickString(raw.experimentLabel) ||
    pickString(meta['experimentLabel']) ||
    pickString(meta['experiment_label']) ||
    pickString(meta['experimentName']) ||
    pickString(meta['experiment_name']) ||
    pickString(meta['task_template_label']) ||
    pickString(meta['taskTemplateLabel']) ||
    pickString(meta['task_template_name']) ||
    pickString(meta['taskTemplateName']);

  const rawSlug =
    pickString(raw.experimentSlug) ||
    pickString(raw.experiment) ||
    metaExperiment ||
    extractExperimentKey(raw.filePath) ||
    extractExperimentKey(raw.id) ||
    'general';

  const slug = normalizeExperimentSlug(String(rawSlug));
  const label = deriveExperimentLabel(slug, metaLabel);
  return { slug, label };
}

function extractExperimentKey(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.replace(/\\/g, '/');
  const segments = normalized.split('/');
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (!segment) continue;
    const base = segment.replace(/\.[^.]+$/, '');
    const match = base.match(/^(exp[0-9a-z]+(?:-[0-9a-z]+)*)/i);
    if (match) {
      const candidate = match[1].replace(/-\d{2,}$/i, '');
      if (candidate) {
        return candidate;
      }
    }
  }
  const fallback = segments[segments.length - 1]?.replace(/\.[^.]+$/, '');
  return fallback ?? null;
}

function normalizeExperimentSlug(slug: string): string {
  const cleaned = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'general';
}

export function deriveExperimentLabel(slug: string, hint?: string | null): string {
  const normalizedSlug = slug.trim();
  const hintText = hint?.trim();
  const numberedMatch = normalizedSlug.match(/^exp[-_ ]?(\d+[a-z]?)(?:[-_](.+))?$/i);
  if (numberedMatch) {
    const idChunk = numberedMatch[1];
    const numericPart = idChunk.match(/\d+/)?.[0] ?? '';
    const letterPart = idChunk.slice(numericPart.length).toUpperCase();
    const digits = numericPart ? numericPart.padStart(2, '0') : '';
    const displayId = letterPart ? `${digits}${letterPart}` : digits;
    const suffix = hintText ?? numberedMatch[2]?.replace(/[-_]/g, ' ');
    if (suffix && suffix.length > 0) {
      return `Experiment ${displayId}: ${titleCase(suffix)}`;
    }
    return `Experiment ${displayId}`;
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
