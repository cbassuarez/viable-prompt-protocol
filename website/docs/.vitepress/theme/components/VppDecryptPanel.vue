<template>
  <DecryptReveal
    v-if="enhanced"
    class="vpp-decrypt-panel vpp-decrypt-panel--enhanced"
    :radius="220"
    :softness="0.48"
    :cell="9"
    :aspect="0.68"
    :colored="0"
    color="#ff7540"
    :brightness="1.25"
    :legibility="0.72"
    :contrast="1.35"
    :scramble="0.12"
    :scramble-speed="7"
    :edge-width="0.18"
    :edge-flicker="0.55"
    :edge-glow="1.25"
    :edge-tint="0.7"
    :aberration="2"
    :passthrough="0.16"
    background="#090807"
    :smoothing="0.16"
    :fallback-paint="paintFallback"
  >
    <slot />
  </DecryptReveal>
  <div v-else class="vpp-decrypt-panel vpp-decrypt-panel--fallback">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';

const DecryptReveal = defineAsyncComponent(
  () => import('../vendor/canvasui/DecryptReveal/DecryptReveal.vue')
);

const enhanced = ref(false);
let motionQuery: MediaQueryList | null = null;
let pointerQuery: MediaQueryList | null = null;

function syncEnhancement(): void {
  const canvas = document.createElement('canvas');
  enhanced.value = Boolean(
    !motionQuery?.matches &&
    pointerQuery?.matches &&
    canvas.getContext('webgl2')
  );
}

function paintFallback(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number
): void {
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.fillStyle = '#090807';
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(255, 117, 64, 0.08)';
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 28) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 28) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const padding = Math.max(28, Math.round(width * 0.055));
  context.font = '600 11px "IBM Plex Mono", monospace';
  context.fillStyle = '#c8bbb0';
  context.fillText('TURN / 04', padding, 52);
  context.fillStyle = '#ff7540';
  context.textAlign = 'right';
  context.fillText('● VALIDATED', width - padding, 52);
  context.textAlign = 'left';

  context.strokeStyle = '#3a2c22';
  context.beginPath();
  context.moveTo(padding, 78);
  context.lineTo(width - padding, 78);
  context.stroke();

  const rows = [
    ['→ !<g>', 'User command'],
    ['→ vpp_prepare_turn', 'Contract + state'],
    ['→ model body', 'Content only'],
    ['→ vpp_format_response', 'Exact wrapper'],
    ['→ vpp_validate_exchange', 'Return safely']
  ];
  const firstRow = 128;
  const step = Math.max(55, Math.floor((height - firstRow - 28) / rows.length));
  context.font = '500 12px "IBM Plex Mono", monospace';
  rows.forEach(([command, label], index) => {
    const y = firstRow + index * step;
    context.fillStyle = '#ffb08c';
    context.fillText(command, padding, y);
    context.fillStyle = '#c8bbb0';
    context.fillText(label, Math.max(padding + 220, width * 0.63), y);
    context.strokeStyle = 'rgba(58, 44, 34, 0.8)';
    context.beginPath();
    context.moveTo(padding, y + 23);
    context.lineTo(width - padding, y + 23);
    context.stroke();
  });
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  pointerQuery = window.matchMedia('(pointer: fine)');
  motionQuery.addEventListener('change', syncEnhancement);
  pointerQuery.addEventListener('change', syncEnhancement);
  syncEnhancement();
});

onBeforeUnmount(() => {
  motionQuery?.removeEventListener('change', syncEnhancement);
  pointerQuery?.removeEventListener('change', syncEnhancement);
});
</script>
