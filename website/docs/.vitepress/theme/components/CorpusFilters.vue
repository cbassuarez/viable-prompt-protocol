<template>
  <section class="corpus-filters">
    <div class="corpus-filters__group">
      <label for="corpus-version">Version</label>
      <select
        id="corpus-version"
        class="corpus-filters__select"
        :value="selectedVersion"
        @change="onVersionChange"
      >
        <option v-for="version in versions" :key="version" :value="version">
          {{ version }}
        </option>
      </select>
    </div>

    <div v-if="experiments.length" class="corpus-filters__group">
      <div class="corpus-filters__label">Experiments</div>
      <div class="corpus-filters__chips corpus-filters__chips--scroll">
        <button
          class="chip"
          :class="{ 'chip--active': selectedExperiment === 'all' }"
          type="button"
          @click="emit('update:experiment', 'all')"
        >
          All experiments
        </button>
        <button
          v-for="experiment in experiments"
          :key="experiment.slug"
          class="chip"
          :class="{ 'chip--active': selectedExperiment === experiment.slug }"
          type="button"
          @click="emit('update:experiment', experiment.slug)"
        >
          {{ experiment.label }}
        </button>
      </div>
    </div>

    <div class="corpus-filters__group">
      <div class="corpus-filters__label">Tags</div>
      <div class="corpus-filters__chips">
        <button
          v-for="tag in tags"
          :key="tag"
          class="chip"
          :class="{ 'chip--active': selectedTags.includes(tag) }"
          type="button"
          @click="emit('toggle-tag', tag)"
        >
          {{ `<${tag}>` }}
        </button>
      </div>
    </div>

    <div class="corpus-filters__grid">
      <div class="corpus-filters__group">
        <div class="corpus-filters__label">Correctness</div>
        <div class="corpus-filters__chips">
          <button
            v-for="option in correctnessOptions"
            :key="option"
            class="chip"
            :class="{ 'chip--active': selectedCorrectness.includes(option) }"
            type="button"
            @click="emit('toggle-correctness', option)"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <div class="corpus-filters__group">
        <div class="corpus-filters__label">Severity</div>
        <div class="corpus-filters__chips">
          <button
            v-for="option in severityOptions"
            :key="option"
            class="chip"
            :class="{ 'chip--active': selectedSeverities.includes(option) }"
            type="button"
            @click="emit('toggle-severity', option)"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <div class="corpus-filters__group">
        <div class="corpus-filters__label">Mode</div>
        <div class="corpus-filters__chips">
          <button
            v-for="option in modeOptions"
            :key="option"
            class="chip"
            :class="{ 'chip--active': selectedModes.includes(option) }"
            type="button"
            @click="emit('toggle-mode', option)"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>

    <div class="corpus-filters__group">
      <label for="corpus-search">Search</label>
      <input
        id="corpus-search"
        class="corpus-filters__search"
        type="search"
        :value="searchQuery"
        placeholder="Search title, summary, or transcript…"
        @input="onSearchInput"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';

const props = defineProps<{
  versions: string[];
  selectedVersion: string;
  tags: string[];
  selectedTags: string[];
  correctnessOptions: string[];
  selectedCorrectness: string[];
  severityOptions: string[];
  selectedSeverities: string[];
  modeOptions: string[];
  selectedModes: string[];
  searchQuery: string;
  experiments: { slug: string; label: string }[];
  selectedExperiment: string;
}>();

const {
  versions,
  selectedVersion,
  tags,
  selectedTags,
  correctnessOptions,
  selectedCorrectness,
  severityOptions,
  selectedSeverities,
  modeOptions,
  selectedModes,
  searchQuery,
  experiments,
  selectedExperiment
} = toRefs(props);

const emit = defineEmits<{
  (event: 'toggle-tag', tag: string): void;
  (event: 'toggle-correctness', correctness: string): void;
  (event: 'toggle-severity', severity: string): void;
  (event: 'toggle-mode', mode: string): void;
  (event: 'update:version', version: string): void;
  (event: 'update:search', value: string): void;
  (event: 'update:experiment', value: string): void;
}>();

function onVersionChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:version', target.value);
}

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:search', target.value);
}
</script>
