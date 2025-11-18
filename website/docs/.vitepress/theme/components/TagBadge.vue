<template>
  <span class="tag-badge" :data-tag="tag">
    <span class="tag-badge__label">{{ displayTag }}</span>
    <span class="tag-badge__text">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CorpusTag } from './corpus-utils';
import { TAG_LABELS } from './corpus-utils';

const props = defineProps<{ tag: CorpusTag }>();

const displayTag = computed(() => `<${props.tag}>`);
const label = computed(() => TAG_LABELS[props.tag] ?? props.tag);
</script>
