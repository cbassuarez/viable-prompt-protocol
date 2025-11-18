<template>
  <div class="corpus-viewer">
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
      @toggle-tag="toggleTag"
      @toggle-correctness="toggleCorrectness"
      @toggle-severity="toggleSeverity"
      @toggle-mode="toggleMode"
      @update:version="onVersionChange"
      @update:search="updateSearch"
    />

    <p v-if="errorMessage" class="corpus-viewer__error">
      {{ errorMessage }}
    </p>

    <div class="corpus-viewer__body">
      <CorpusList
        :entries="sortedEntries"
        :selected-id="selectedEntryId"
        :loading="isLoading"
        @select="handleSelect"
      />
      <CorpusDetail :entry="selectedEntry" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import type { CorpusEntry, CorpusMode, CorpusTag, CorpusCorrectness } from './corpus-utils';
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

const entriesByVersion = ref<Record<string, CorpusEntry[]>>({});
const isLoading = ref(false);
const errorMessage = ref('');
const selectedEntryId = ref<string | null>(null);
const loadedVersions = new Set<string>();
const isClient = typeof window !== 'undefined';

onMounted(() => {
  if (isClient) {
    loadVersion(selectedVersion.value);
  }
});

watch(selectedVersion, (version) => {
  if (!isClient) return;
  if (loadedVersions.has(version)) {
    syncSelectedEntry();
    return;
  }
  loadVersion(version);
});

const currentEntries = computed(() => entriesByVersion.value[selectedVersion.value] ?? []);

const filteredEntries = computed(() =>
  filterEntries(currentEntries.value, {
    tags: selectedTags.value,
    correctness: selectedCorrectness.value,
    severities: selectedSeverities.value,
    modes: selectedModes.value,
    searchQuery: searchQuery.value
  })
);

const sortedEntries = computed(() => sortEntries(filteredEntries.value));

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
  return `/corpus/${version}/corpus-v${slug}.json`;
}

function onVersionChange(version: string) {
  selectedVersion.value = version;
}

function updateSearch(value: string) {
  searchQuery.value = value;
}

function handleSelect(id: string) {
  selectedEntryId.value = id;
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
</script>
