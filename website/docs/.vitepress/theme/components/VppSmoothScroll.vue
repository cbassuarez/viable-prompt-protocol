<template></template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vitepress';
import type Lenis from 'lenis';

const route = useRoute();
let instance: Lenis | null = null;
let motionQuery: MediaQueryList | null = null;
let pointerQuery: MediaQueryList | null = null;
let disposed = false;

async function configure(): Promise<void> {
  instance?.destroy();
  instance = null;
  if (
    disposed ||
    motionQuery?.matches ||
    !pointerQuery?.matches
  ) {
    return;
  }

  const { default: LenisRuntime } = await import('lenis');
  if (disposed) return;
  instance = new LenisRuntime({
    autoRaf: true,
    smoothWheel: true,
    syncTouch: false,
    duration: 1.55,
    wheelMultiplier: 0.7,
    overscroll: true,
    anchors: {
      duration: 1.35,
      offset: -88
    },
    stopInertiaOnNavigate: true,
    allowNestedScroll: true
  });
}

function reconfigure(): void {
  void configure();
}

watch(
  () => route.path,
  async () => {
    await nextTick();
    instance?.resize();
  }
);

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  pointerQuery = window.matchMedia('(pointer: fine)');
  motionQuery.addEventListener('change', reconfigure);
  pointerQuery.addEventListener('change', reconfigure);
  void configure();
});

onBeforeUnmount(() => {
  disposed = true;
  motionQuery?.removeEventListener('change', reconfigure);
  pointerQuery?.removeEventListener('change', reconfigure);
  instance?.destroy();
  instance = null;
});
</script>
