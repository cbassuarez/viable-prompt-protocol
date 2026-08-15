<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import {
  createDecryptReveal,
  supportsHtmlInCanvas,
  type DecryptRevealInstance,
  type DecryptRevealOptions,
} from "./DecryptRevealVanilla";

const props = defineProps({
  radius: Number,
  softness: Number,
  cell: Number,
  aspect: Number,
  charset: String,
  colored: Number,
  color: String,
  brightness: Number,
  legibility: Number,
  contrast: Number,
  exposure: Number,
  scramble: Number,
  scrambleSpeed: Number,
  edgeWidth: Number,
  edgeFlicker: Number,
  edgeGlow: Number,
  edgeTint: Number,
  aberration: Number,
  passthrough: Number,
  threshold: Number,
  background: String,
  smoothing: Number,
  fallbackPaint: Function
});

const sourceEl = ref<HTMLCanvasElement | null>(null);
const contentEl = ref<HTMLDivElement | null>(null);
const outputEl = ref<HTMLCanvasElement | null>(null);
const native = ref(false);

let instance: DecryptRevealInstance | null = null;
let disposed = false;

function currentOptions(): DecryptRevealOptions {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as DecryptRevealOptions;
}

onMounted(async () => {
  native.value = supportsHtmlInCanvas();
  await nextTick();
  if (disposed) return;
  if (sourceEl.value && contentEl.value && outputEl.value) {
    instance = createDecryptReveal(
      {
        source: sourceEl.value,
        content: contentEl.value,
        output: outputEl.value,
      },
      currentOptions(),
    );
    if (native.value && !instance) {
      native.value = false;
      await nextTick();
      if (disposed) return;
      if (sourceEl.value && contentEl.value && outputEl.value) {
        instance = createDecryptReveal(
          {
            source: sourceEl.value,
            content: contentEl.value,
            output: outputEl.value,
          },
          currentOptions(),
        );
      }
    }
  }
});

onBeforeUnmount(() => {
  disposed = true;
  instance?.destroy();
  instance = null;
});

watch(
  () => ({ ...props }),
  () => instance?.setOptions(currentOptions()),
  { deep: true },
);
</script>

<template>
  <div style="position: relative">
    <canvas
      ref="sourceEl"
      layoutsubtree="true"
      :style="
        native
          ? 'position: absolute; inset: 0; width: 100%; height: 100%'
          : 'display: none'
      "
    >
      <div
        v-if="native"
        ref="contentEl"
        style="position: relative; width: 100%; height: 100%; overflow: auto"
      >
        <slot />
      </div>
    </canvas>
    <div
      v-if="!native"
      ref="contentEl"
      style="position: relative; width: 100%; height: 100%; overflow: auto"
    >
      <slot />
    </div>
    <canvas
      ref="outputEl"
      aria-hidden="true"
      style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      "
    />
  </div>
</template>
