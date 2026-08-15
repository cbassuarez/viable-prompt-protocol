<template>
  <Teleport v-if="mountedOnce" :to="glassHost">
    <span
      class="vpp-shared-glass"
      :class="{ 'vpp-shared-glass--visible': visible }"
      aria-hidden="true"
    >
      <GlassObject
        class="vpp-shared-glass__object"
        :src="glassSource"
        :ior="1.52"
        :thickness="1.4"
        :roughness="0.12"
        :dispersion="0.45"
        :clearcoat="1"
        :tint="tint"
        :tint-density="0.18"
        :depth="0.02"
        :bevel="0"
        :highlight="highlight"
        :environment-intensity="1.4"
        background=""
        background-image=""
        :scale="18"
        :float-intensity="0"
        :rotation-intensity="0"
        :orbit="false"
        :zoom="false"
        :auto-rotate="false"
        :fov="24"
        :camera-distance="4"
        :on-load="handleGlassLoad"
        :on-error="handleGlassError"
      />
    </span>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef
} from 'vue';
import { withBase } from 'vitepress';

const GlassObject = defineAsyncComponent(
  () => import('../vendor/canvasui/GlassObject/GlassObject.vue')
);

const mountedOnce = ref(false);
const visible = ref(false);
const shape = ref<'rect' | 'square'>('rect');
const highlight = ref('#ff8a56');
const tint = ref('#e95420');
const activeTarget = shallowRef<HTMLElement | null>(null);
const loadedShape = ref<'rect' | 'square' | null>(null);
let hoveredTarget: HTMLElement | null = null;
let focusedTarget: HTMLElement | null = null;
let enabled = false;

const glassSource = computed(() => withBase('/canvas/glass-' + shape.value + '.svg'));
const glassHost = computed<HTMLElement | 'body'>(() => activeTarget.value ?? 'body');

function glassTarget(value: EventTarget | null): HTMLElement | null {
  if (!(value instanceof Element)) return null;
  const target = value.closest<HTMLElement>('.vpp-glass');
  if (!target || target.matches(':disabled, [aria-disabled="true"]')) return null;
  return target;
}

function readTheme(): void {
  const styles = getComputedStyle(document.documentElement);
  highlight.value = styles.getPropertyValue('--vpp-glass-highlight').trim() || '#ff8a56';
  tint.value = styles.getPropertyValue('--vpp-orange-display').trim() || '#e95420';
}

function revealLoadedGlass(): void {
  if (!activeTarget.value || loadedShape.value !== shape.value) return;
  activeTarget.value.classList.add('vpp-glass--canvas-active');
  visible.value = true;
}

function handleGlassLoad(): void {
  loadedShape.value = shape.value;
  revealLoadedGlass();
}

function handleGlassError(): void {
  activeTarget.value?.classList.remove('vpp-glass--canvas-active');
  loadedShape.value = null;
  visible.value = false;
}

async function activate(target: HTMLElement | null): Promise<void> {
  if (!enabled || !target) {
    activeTarget.value?.classList.remove('vpp-glass--canvas-active');
    activeTarget.value = null;
    visible.value = false;
    return;
  }
  const nextShape = target.dataset.glassShape === 'square' ? 'square' : 'rect';
  activeTarget.value?.classList.remove('vpp-glass--canvas-active');
  visible.value = false;
  activeTarget.value = target;
  shape.value = nextShape;
  readTheme();
  mountedOnce.value = true;
  await nextTick();
  revealLoadedGlass();
}

function reconcile(): void {
  void activate(focusedTarget ?? hoveredTarget);
}

function onPointerOver(event: PointerEvent): void {
  const target = glassTarget(event.target);
  if (!target || target === hoveredTarget) return;
  hoveredTarget = target;
  reconcile();
}

function onPointerOut(event: PointerEvent): void {
  if (!hoveredTarget) return;
  if (event.relatedTarget instanceof Node && hoveredTarget.contains(event.relatedTarget)) return;
  hoveredTarget = null;
  reconcile();
}

function onFocusIn(event: FocusEvent): void {
  focusedTarget = glassTarget(event.target);
  reconcile();
}

function onFocusOut(event: FocusEvent): void {
  if (event.relatedTarget instanceof Node && focusedTarget?.contains(event.relatedTarget)) return;
  focusedTarget = null;
  reconcile();
}

function supportAvailable(): boolean {
  const canvas = document.createElement('canvas');
  return Boolean(
    window.matchMedia('(pointer: fine)').matches &&
    canvas.getContext('webgl2')
  );
}

onMounted(() => {
  enabled = supportAvailable();
  document.addEventListener('pointerover', onPointerOver, { passive: true });
  document.addEventListener('pointerout', onPointerOut, { passive: true });
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
});

onBeforeUnmount(() => {
  activeTarget.value?.classList.remove('vpp-glass--canvas-active');
  document.removeEventListener('pointerover', onPointerOver);
  document.removeEventListener('pointerout', onPointerOut);
  document.removeEventListener('focusin', onFocusIn);
  document.removeEventListener('focusout', onFocusOut);
});
</script>
