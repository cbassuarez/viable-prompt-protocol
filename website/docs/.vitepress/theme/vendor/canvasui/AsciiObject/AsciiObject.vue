<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import {
  createAsciiObject,
  type AsciiObjectInstance,
  type AsciiObjectOptions,
} from "./AsciiObjectVanilla";

const props = defineProps({
  src: String,
  ascii: { type: Boolean, default: undefined },
  cellSize: Number,
  cellAspect: Number,
  charset: String,
  colored: { type: Boolean, default: undefined },
  color: String,
  contrast: Number,
  edgeContrast: Number,
  exposure: Number,
  invert: { type: Boolean, default: undefined },
  background: String,
  highlight: String,
  environmentIntensity: Number,
  roughness: Number,
  scale: Number,
  xOffset: Number,
  yOffset: Number,
  floatIntensity: Number,
  rotationIntensity: Number,
  floatSpeed: Number,
  orbit: { type: Boolean, default: undefined },
  zoom: { type: Boolean, default: undefined },
  autoRotate: { type: Boolean, default: undefined },
  autoRotateSpeed: Number,
  fov: Number,
  cameraDistance: Number,
  dracoDecoderPath: String,
  onLoad: Function,
  onError: Function
});

const canvasEl = ref<HTMLCanvasElement | null>(null);

let instance: AsciiObjectInstance | null = null;

function currentOptions(): AsciiObjectOptions {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as AsciiObjectOptions;
}

onMounted(() => {
  if (canvasEl.value) {
    instance = createAsciiObject(
      { canvas: canvasEl.value },
      currentOptions(),
    );
  }
});

onBeforeUnmount(() => {
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
  <span style="position: relative; display: block">
    <canvas
      ref="canvasEl"
      style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        touch-action: none;
      "
    />
  </span>
</template>
