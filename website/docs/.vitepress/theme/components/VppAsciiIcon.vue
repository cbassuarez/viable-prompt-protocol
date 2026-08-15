<template>
  <span
    class="vpp-ascii-icon"
    :class="{ 'vpp-ascii-icon--ready': ready }"
    :style="iconStyle"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
  >
    <pre
      v-if="showFallback && fallbackAscii"
      class="vpp-ascii-icon__fallback vpp-ascii-icon__fallback--ascii"
      aria-hidden="true"
    >{{ fallbackAscii }}</pre>
    <img
      v-else-if="showFallback"
      class="vpp-ascii-icon__fallback"
      :src="resolvedFallbackSrc"
      alt=""
      aria-hidden="true"
    />
    <AsciiObject
      v-if="enhanced"
      class="vpp-ascii-icon__canvas"
      aria-hidden="true"
      :src="resolvedSrc"
      :cell-size="cellSize"
      :cell-aspect="cellAspect"
      :charset="charset"
      :colored="colored"
      :color="color"
      :contrast="contrast"
      :edge-contrast="edgeContrast"
      :exposure="exposure"
      background=""
      :highlight="highlight"
      :environment-intensity="environmentIntensity"
      :roughness="roughness"
      :scale="scale"
      :x-offset="xOffset"
      :y-offset="yOffset"
      :float-intensity="reducedMotion ? 0 : floatIntensity"
      :rotation-intensity="reducedMotion ? 0 : rotationIntensity"
      :float-speed="1.1"
      :orbit="orbit"
      :zoom="false"
      :auto-rotate="reducedMotion ? false : autoRotate"
      :auto-rotate-speed="autoRotateSpeed"
      :fov="fov"
      :camera-distance="cameraDistance"
      :on-load="handleLoad"
      :on-error="handleError"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';

const AsciiObject = defineAsyncComponent(
  () => import('../vendor/canvasui/AsciiObject/AsciiObject.vue')
);

const props = withDefaults(defineProps<{
  src: string;
  fallbackSrc?: string;
  alt?: string;
  size?: number;
  cellSize?: number;
  cellAspect?: number;
  colored?: boolean;
  color?: string;
  highlight?: string;
  contrast?: number;
  edgeContrast?: number;
  exposure?: number;
  environmentIntensity?: number;
  roughness?: number;
  scale?: number;
  xOffset?: number;
  yOffset?: number;
  floatIntensity?: number;
  rotationIntensity?: number;
  charset?: string;
  fallbackAscii?: string;
  showFallback?: boolean;
  orbit?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  fov?: number;
  cameraDistance?: number;
}>(), {
  fallbackSrc: '',
  alt: '',
  size: 96,
  cellSize: 6,
  cellAspect: 0.62,
  colored: false,
  color: '#e95420',
  highlight: '#ff8a56',
  contrast: 1.7,
  edgeContrast: 3.2,
  exposure: 1.08,
  environmentIntensity: 1.1,
  roughness: -1,
  scale: 3,
  xOffset: 0,
  yOffset: 0,
  floatIntensity: 0,
  rotationIntensity: 0,
  charset: ' .,:;irsXA253hMHGS#9B&@',
  fallbackAscii: '',
  showFallback: true,
  orbit: false,
  autoRotate: false,
  autoRotateSpeed: 0.6,
  fov: 65,
  cameraDistance: 4.2
});

const enhanced = ref(false);
const ready = ref(false);
const reducedMotion = ref(false);
let motionQuery: MediaQueryList | null = null;

const resolvedSrc = computed(() => props.src.startsWith('/') ? withBase(props.src) : props.src);
const resolvedFallbackSrc = computed(() => {
  const source = props.fallbackSrc || props.src;
  return source.startsWith('/') ? withBase(source) : source;
});
const iconStyle = computed(() => ({ '--vpp-ascii-size': String(props.size) + 'px' }));

function supportsCanvasEffects(): boolean {
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl2'));
}

function syncMotionPreference(): void {
  reducedMotion.value = motionQuery?.matches ?? false;
}

function handleLoad(): void {
  ready.value = true;
}

function handleError(): void {
  enhanced.value = false;
  ready.value = false;
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncMotionPreference();
  motionQuery.addEventListener('change', syncMotionPreference);
  enhanced.value = supportsCanvasEffects();
});

onBeforeUnmount(() => {
  motionQuery?.removeEventListener('change', syncMotionPreference);
});
</script>
