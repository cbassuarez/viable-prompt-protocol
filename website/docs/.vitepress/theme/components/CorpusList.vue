<template>
  <section class="corpus-list" aria-label="Corpus entries">
    <div v-if="loading" class="corpus-list__empty">Loading entries…</div>
    <div v-else-if="entries.length === 0" class="corpus-list__empty">
      No entries match the current filters.
    </div>
    <ul v-else class="corpus-list__items">
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="corpus-list__entry"
      >
        <button
          type="button"
          class="corpus-list__item vpp-glass"
          :class="{ 'corpus-list__item--selected': entry.id === selectedId }"
          :aria-pressed="entry.id === selectedId"
          @click="() => emit('select', entry.id)"
        >
          <span class="corpus-list__meta">
            <TagBadge :tag="entry.tag" />
            <span class="badge" :class="'badge--' + entry.correctness">
              {{ entry.correctness }}
            </span>
            <span v-if="entry.severity" class="badge" :class="'badge--' + entry.severity">
              {{ entry.severity }} severity
            </span>
            <span class="badge badge--mode">{{ entry.mode }}</span>
          </span>
          <span class="corpus-list__text">
            <strong>{{ entry.title }}</strong>
            <span class="corpus-list__summary">{{ entry.summary }}</span>
            <span class="corpus-list__rules">
              <span v-for="rule in entry.ruleIds.slice(0, 3)" :key="rule" class="badge badge--rule">
                {{ rule }}
              </span>
              <span v-if="entry.ruleIds.length > 3" class="badge badge--rule">+{{ entry.ruleIds.length - 3 }} more</span>
            </span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { CorpusEntry } from './corpus-utils';
import TagBadge from './TagBadge.vue';

defineProps<{
  entries: CorpusEntry[];
  selectedId: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{ (event: 'select', id: string): void }>();
</script>
