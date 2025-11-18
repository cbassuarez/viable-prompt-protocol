<template>
  <section class="corpus-viewer-shell">
    <header class="corpus-viewer__top-bar">
      <div>
        <p class="corpus-viewer__eyebrow">Corpus viewer</p>
        <h2>Protocol transcripts</h2>
        <p class="corpus-viewer__lead">Explore experiment transcripts, tags, and rulings.</p>
      </div>
      <button
        ref="theaterTriggerRef"
        class="corpus-viewer__theater-toggle"
        type="button"
        :disabled="!canUseTheater"
        aria-label="Enter theater mode"
        @click="openTheater"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M5 9V5h4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M19 9V5h-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M5 15v4h4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M19 15v4h-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </header>

    <div v-if="!isTheater" class="corpus-viewer" aria-label="Corpus viewer workspace">
      <CorpusFilters
        :versions="availableVersions"
        :selected-version="selectedVersion"
        :tags="tagOptions"
        :selected-tags="Array.from(selectedTags)"
        :correctness-options="correctnessOptions"
        :selected-correctness="Array.from(selectedCorrectness)"
        :severity-options="severityOptions"
        :selected-severities="Array.from(selectedSeverities)"
        :mode-options="modeOptions"
        :selected-modes="Array.from(selectedModes)"
        :search-query="searchQuery"
        :experiments="experimentOptions"
        :selected-experiment="selectedExperiment"
        @toggle-tag="toggleTag"
        @toggle-correctness="toggleCorrectness"
        @toggle-severity="toggleSeverity"
        @toggle-mode="toggleMode"
        @update:version="onVersionChange"
        @update:search="updateSearch"
        @update:experiment="updateExperiment"
      />

      <p v-if="errorMessage" class="corpus-viewer__error">
        {{ errorMessage }}
      </p>

      <div v-if="showEmptyState" class="corpus-viewer__empty">
        <p class="corpus-viewer__empty-title">No entries match the current filters.</p>
        <p class="corpus-viewer__empty-hint">Adjust experiment, tag, or search filters to see results.</p>
      </div>
      <div v-else class="corpus-viewer__body">
        <CorpusList
          :entries="sortedEntries"
          :selected-id="selectedEntryId"
          :loading="isLoading"
          @select="handleSelect"
        />
        <CorpusDetail :entry="selectedEntry" :is-theater="false" @toggle-theater="openTheater" />
      </div>
    </div>

    <Teleport to="body">
      <Transition name="corpus-theater">
        <div
          v-if="isTheater"
          class="corpus-theater-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Corpus viewer theater mode"
        >
          <header class="corpus-theater__header">
            <div>
              <p class="corpus-theater__eyebrow">Corpus Viewer — Theater mode</p>
              <h2>Version {{ selectedVersion }}</h2>
              <p v-if="activeExperimentLabel">Experiment: {{ activeExperimentLabel }}</p>
            </div>
            <button
              ref="theaterCloseButtonRef"
              class="corpus-theater__close"
              type="button"
              @click="closeTheater"
            >
              Exit (Esc)
            </button>
          </header>
          <div class="corpus-theater__body">
            <div class="corpus-viewer corpus-viewer--theater" aria-label="Corpus viewer theater workspace">
              <CorpusFilters
                :versions="availableVersions"
                :selected-version="selectedVersion"
                :tags="tagOptions"
                :selected-tags="Array.from(selectedTags)"
                :correctness-options="correctnessOptions"
                :selected-correctness="Array.from(selectedCorrectness)"
                :severity-options="severityOptions"
                :selected-severities="Array.from(selectedSeverities)"
                :mode-options="modeOptions"
                :selected-modes="Array.from(selectedModes)"
                :search-query="searchQuery"
                :experiments="experimentOptions"
                :selected-experiment="selectedExperiment"
                @toggle-tag="toggleTag"
                @toggle-correctness="toggleCorrectness"
                @toggle-severity="toggleSeverity"
                @toggle-mode="toggleMode"
                @update:version="onVersionChange"
                @update:search="updateSearch"
                @update:experiment="updateExperiment"
              />

              <p v-if="errorMessage" class="corpus-viewer__error">
                {{ errorMessage }}
              </p>

              <div
                v-if="showEmptyState"
                class="corpus-viewer__empty corpus-viewer__empty--theater"
              >
                <p class="corpus-viewer__empty-title">No entries match the current filters.</p>
                <p class="corpus-viewer__empty-hint">
                  Adjust experiment, tag, or search filters to see results.
                </p>
              </div>
              <div v-else class="corpus-viewer__body corpus-viewer__body--theater">
                <CorpusList
                  :entries="sortedEntries"
                  :selected-id="selectedEntryId"
                  :loading="isLoading"
                  @select="handleSelect"
                />
                <CorpusDetail :entry="selectedEntry" :is-theater="true" @toggle-theater="closeTheater" />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import type {
  CorpusEntry,
  CorpusMode,
  CorpusTag,
  CorpusCorrectness,
  ExperimentFilterState
} from './corpus-utils';
import { TAG_ORDER, filterEntries, mapRawEntry, sortEntries } from './corpus-utils';
import CorpusFilters from './CorpusFilters.vue';
import CorpusList from './CorpusList.vue';
import CorpusDetail from './CorpusDetail.vue';

const availableVersions = ['v1.4'];
const tagOptions = TAG_ORDER;
const correctnessOptions: CorpusCorrectness[] = ['correct', 'incorrect'];
const severityOptions = ['minor', 'major'];
const modeOptions: CorpusMode[] = ['failure', 'edge', 'happy'];

const selectedVersion = ref(availableVersions[0]);
const searchQuery = ref('');
const selectedTags = ref<Set<CorpusTag>>(new Set(tagOptions));
const selectedCorrectness = ref<Set<CorpusCorrectness>>(new Set(correctnessOptions));
const selectedSeverities = ref<Set<'minor' | 'major'>>(new Set());
const selectedModes = ref<Set<CorpusMode>>(new Set(modeOptions));
const selectedExperiment = ref<ExperimentFilterState>('all');

const entriesByVersion = ref<Record<string, CorpusEntry[]>>({});
const isLoading = ref(false);
const errorMessage = ref('');
const selectedEntryId = ref<string | null>(null);
const loadedVersions = new Set<string>();
const isClient = typeof window !== 'undefined';
const isTheater = ref(false);
const focusedIndex = ref<number | null>(null);
const theaterTriggerRef = ref<HTMLButtonElement | null>(null);
const theaterCloseButtonRef = ref<HTMLButtonElement | null>(null);

onMounted(() => {
  if (isClient) {
    loadVersion(selectedVersion.value);
    window.addEventListener('keydown', onKeyDown);
  }
});

onBeforeUnmount(() => {
  if (!isClient) return;
  window.removeEventListener('keydown', onKeyDown);
  document.body.classList.remove('body--no-scroll');
});

watch(selectedVersion, (version) => {
  if (!isClient) return;
  selectedExperiment.value = 'all';
  if (loadedVersions.has(version)) {
    syncSelectedEntry();
    return;
  }
  loadVersion(version);
});

const currentEntries = computed(() => entriesByVersion.value[selectedVersion.value] ?? []);

interface ExperimentOption {
  slug: string;
  label: string;
}

const experimentOptions = computed<ExperimentOption[]>(() => {
  const seen = new Map<string, string>();
  for (const entry of currentEntries.value) {
    if (!seen.has(entry.experimentSlug)) {
      seen.set(entry.experimentSlug, entry.experimentLabel);
    }
  }
  return Array.from(seen.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => compareExperimentOptions(a, b));
});

watch(experimentOptions, (options) => {
  if (selectedExperiment.value === 'all') return;
  const exists = options.some((option) => option.slug === selectedExperiment.value);
  if (!exists) {
    selectedExperiment.value = 'all';
  }
});

const filteredEntries = computed(() =>
  filterEntries(currentEntries.value, {
    tags: selectedTags.value,
    correctness: selectedCorrectness.value,
    severities: selectedSeverities.value,
    modes: selectedModes.value,
    searchQuery: searchQuery.value,
    experiment: selectedExperiment.value
  })
);

const sortedEntries = computed(() => sortEntries(filteredEntries.value));

const canUseTheater = computed(() => sortedEntries.value.length > 0);
const showEmptyState = computed(() => !isLoading.value && sortedEntries.value.length === 0);
const activeExperimentLabel = computed(() => {
  if (selectedExperiment.value === 'all') {
    return '';
  }
  const match = experimentOptions.value.find((option) => option.slug === selectedExperiment.value);
  return match?.label ?? '';
});

const selectedEntry = computed(() =>
  sortedEntries.value.find((entry) => entry.id === selectedEntryId.value) ?? null
);

watch(
  () => sortedEntries.value,
  (entries) => {
    if (entries.length === 0) {
      selectedEntryId.value = null;
      return;
    }
    if (!selectedEntryId.value || !entries.some((entry) => entry.id === selectedEntryId.value)) {
      selectedEntryId.value = entries[0].id;
    }
  },
  { immediate: true }
);

watch(selectedEntryId, () => {
  if (isTheater.value) {
    syncFocusedIndexWithSelection();
  }
});

watch(isTheater, (active) => {
  if (!isClient) return;
  const body = document.body;
  if (active) {
    body.classList.add('body--no-scroll');
    syncFocusedIndexWithSelection();
    nextTick(() => {
      theaterCloseButtonRef.value?.focus();
    });
  } else {
    body.classList.remove('body--no-scroll');
    focusedIndex.value = null;
    nextTick(() => {
      const trigger = theaterTriggerRef.value;
      if (trigger && !trigger.disabled) {
        trigger.focus();
      }
    });
  }
});

async function loadVersion(version: string) {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const response = await fetch(withBase(corpusUrl(version)));
    if (!response.ok) {
      throw new Error(`Failed to load corpus for ${version} (${response.status})`);
    }
    const rawEntries = (await response.json()) as unknown[];
    const entries = rawEntries.map((entry) => mapRawEntry(entry as any, version));
    entriesByVersion.value = {
      ...entriesByVersion.value,
      [version]: entries
    };
    loadedVersions.add(version);
    syncSelectedEntry();
  } catch (error) {
    console.error(error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load corpus data.';
  } finally {
    isLoading.value = false;
  }
}

function corpusUrl(version: string) {
  const slug = version.replace('.', '_');
  return `/corpus/${version}/corpus-${slug}.json`;
}

function compareExperimentOptions(a: ExperimentOption, b: ExperimentOption): number {
  const aIndex = getExperimentSortIndex(a.slug);
  const bIndex = getExperimentSortIndex(b.slug);
  if (aIndex !== null && bIndex !== null && aIndex !== bIndex) {
    return aIndex - bIndex;
  }
  if (aIndex !== null && bIndex === null) {
    return -1;
  }
  if (aIndex === null && bIndex !== null) {
    return 1;
  }
  return a.label.localeCompare(b.label, 'en', { numeric: true });
}

function getExperimentSortIndex(slug: string): number | null {
  const match = slug.match(/^exp-?(\d+)/);
  if (match) {
    return Number(match[1]);
  }
  return null;
}

function onVersionChange(version: string) {
  selectedVersion.value = version;
}

function updateSearch(value: string) {
  searchQuery.value = value;
}

function updateExperiment(value: string) {
  selectedExperiment.value = (value === 'all' ? 'all' : value) as ExperimentFilterState;
}

function handleSelect(id: string) {
  selectedEntryId.value = id;
  if (isTheater.value) {
    syncFocusedIndexWithSelection();
  }
}

function toggleTag(tag: CorpusTag) {
  const next = new Set(selectedTags.value);
  if (next.has(tag)) {
    next.delete(tag);
  } else {
    next.add(tag);
  }
  if (next.size === 0) {
    next.add(tag);
  }
  selectedTags.value = next;
}

function toggleCorrectness(value: CorpusCorrectness) {
  const next = new Set(selectedCorrectness.value);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  if (next.size === 0) {
    next.add(value);
  }
  selectedCorrectness.value = next;
}

function toggleSeverity(value: 'minor' | 'major') {
  const next = new Set(selectedSeverities.value);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  selectedSeverities.value = next;
}

function toggleMode(value: CorpusMode) {
  const next = new Set(selectedModes.value);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  if (next.size === 0) {
    next.add(value);
  }
  selectedModes.value = next;
}

function syncSelectedEntry() {
  const entries = entriesByVersion.value[selectedVersion.value] ?? [];
  if (entries.length === 0) {
    selectedEntryId.value = null;
    return;
  }
  if (!selectedEntryId.value) {
    selectedEntryId.value = entries[0].id;
  }
}

function openTheater() {
  if (!canUseTheater.value) return;
  if (!selectedEntryId.value && sortedEntries.value.length) {
    selectedEntryId.value = sortedEntries.value[0].id;
  }
  isTheater.value = true;
}

function closeTheater() {
  isTheater.value = false;
}

function getSelectedIndex(): number | null {
  const index = sortedEntries.value.findIndex((entry) => entry.id === selectedEntryId.value);
  return index >= 0 ? index : null;
}

function selectByIndex(index: number) {
  const entry = sortedEntries.value[index];
  if (entry) {
    selectedEntryId.value = entry.id;
  }
}

function syncFocusedIndexWithSelection() {
  focusedIndex.value = getSelectedIndex();
}

function onKeyDown(event: KeyboardEvent) {
  if (!isTheater.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeTheater();
    return;
  }

  if (!sortedEntries.value.length) return;

  const currentIndex = getSelectedIndex() ?? 0;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    const next = (currentIndex + 1) % sortedEntries.value.length;
    selectByIndex(next);
    focusedIndex.value = next;
    return;
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    const prev = (currentIndex - 1 + sortedEntries.value.length) % sortedEntries.value.length;
    selectByIndex(prev);
    focusedIndex.value = prev;
  }
}
</script>
