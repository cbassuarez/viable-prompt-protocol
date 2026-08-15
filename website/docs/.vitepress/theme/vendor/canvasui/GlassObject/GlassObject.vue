<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import {
  createGlassObject,
  type GlassObjectInstance,
  type GlassObjectOptions,
} from "./GlassObjectVanilla";

const props = defineProps({
  src: String,
  ior: Number,
  thickness: Number,
  roughness: Number,
  dispersion: Number,
  clearcoat: Number,
  tint: String,
  tintDensity: Number,
  depth: Number,
  bevel: Number,
  highlight: String,
  environmentIntensity: Number,
  background: String,
  backgroundImage: String,
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

let instance: GlassObjectInstance | null = null;

function currentOptions(): GlassObjectOptions {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as GlassObjectOptions;
}

onMounted(() => {
  if (canvasEl.value) {
    instance = createGlassObject(
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
