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
}

export interface FilterState {
  tags: Set<CorpusTag>;
  correctness: Set<CorpusCorrectness>;
  severities: Set<Exclude<CorpusSeverity, null>>;
  modes: Set<CorpusMode>;
  searchQuery: string;
}

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
    notes: raw.notes ?? null
  };
}

export function filterEntries(entries: CorpusEntry[], state: FilterState): CorpusEntry[] {
  const query = state.searchQuery.trim().toLowerCase();
  return entries.filter((entry) => {
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
