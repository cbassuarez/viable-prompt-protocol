<template>
  <section class="corpus-detail" aria-live="polite">
    <div v-if="!entry" class="corpus-detail__empty">
      Select an entry to view the transcript details.
    </div>
    <div v-else>
      <header class="corpus-detail__header">
        <div class="corpus-detail__header-main">
          <TagBadge :tag="entry.tag" />
          <div>
            <h2>{{ entry.title }}</h2>
            <p>{{ entry.summary }}</p>
          </div>
        </div>
        <button
          class="corpus-detail__theater"
          type="button"
          :aria-label="theaterButtonLabel"
          @click="emit('toggle-theater')"
        >
          <svg
            v-if="isTheater"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M9 5v4H5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15 5v4h4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M9 19v-4H5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15 19v-4h4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            v-else
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
      <div class="corpus-detail__experiment">
        <span class="badge badge--experiment">
          <span class="badge--experiment-label">Experiment:</span>
          <span>{{ entry.experimentLabel }}</span>
        </span>
      </div>
      <dl class="corpus-detail__meta">
        <div>
          <dt>ID</dt>
          <dd>{{ entry.id }}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{{ entry.version }}</dd>
        </div>
        <div>
          <dt>Correctness</dt>
          <dd>{{ entry.correctness }}</dd>
        </div>
        <div>
          <dt>Severity</dt>
          <dd>{{ entry.severity ?? '—' }}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{{ entry.mode }}</dd>
        </div>
        <div>
          <dt>Experiment</dt>
          <dd>{{ entry.experimentLabel }}</dd>
        </div>
      </dl>

      <section class="corpus-detail__rules">
        <h3>What this tests</h3>
        <ul>
          <li v-for="rule in entry.ruleIds" :key="rule">
            <strong>{{ ruleLabel(rule) }}</strong>
            <span class="corpus-detail__rule-id">({{ rule }})</span>
          </li>
        </ul>
      </section>

      <section class="corpus-detail__conversation">
        <h3>Conversation snapshot</h3>
        <div class="corpus-detail__bubble corpus-detail__bubble--user">
          <h4>User</h4>
          <pre>{{ entry.userText }}</pre>
        </div>
        <div class="corpus-detail__bubble corpus-detail__bubble--assistant">
          <h4>Assistant</h4>
          <pre>{{ entry.assistantText }}</pre>
        </div>
      </section>

      <section v-if="entry.notes" class="corpus-detail__notes">
        <h3>Notes</h3>
        <p>{{ entry.notes }}</p>
      </section>

      <section class="corpus-detail__links">
        <a v-if="entry.filePath" :href="fileUrl" target="_blank" rel="noreferrer">
          View source file ↗
        </a>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CorpusEntry } from './corpus-utils';
import { RULE_LABELS } from './corpus-utils';
import TagBadge from './TagBadge.vue';

const props = defineProps<{ entry: CorpusEntry | null; isTheater?: boolean }>();

const emit = defineEmits<{ (event: 'toggle-theater'): void }>();

const isTheater = computed(() => props.isTheater ?? false);
const theaterButtonLabel = computed(() =>
  isTheater.value ? 'Exit theater mode' : 'Enter theater mode'
);

const fileUrl = computed(() => {
  if (!props.entry || !props.entry.filePath) {
    return '';
  }
  return `https://github.com/cbassuarez/viable-prompt-protocol/blob/main/${props.entry.filePath}`;
});

function ruleLabel(ruleId: string): string {
  return RULE_LABELS[ruleId] ?? ruleId;
}
</script>
