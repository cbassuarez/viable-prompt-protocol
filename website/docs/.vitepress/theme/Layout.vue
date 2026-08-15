<template>
  <div class="vpp-layout">
    <Layout>
      <template #home-hero-before>
        <VppHome v-if="isHome" />
      </template>
    </Layout>
    <VppSharedGlassLayer />
    <VppSmoothScroll />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useRoute } from 'vitepress';
import VppSharedGlassLayer from './components/VppSharedGlassLayer.vue';
import VppSmoothScroll from './components/VppSmoothScroll.vue';

const { Layout } = DefaultTheme;
const VppHome = defineAsyncComponent(() => import('./components/VppHome.vue'));
const route = useRoute();
const isHome = computed(() => route.path === '/');
let transitionTimer: ReturnType<typeof setTimeout> | null = null;

async function animateRouteContent(): Promise<void> {
  if (typeof document === 'undefined') return;
  await nextTick();
  const content = document.querySelector<HTMLElement>(
    route.path === '/' ? '.vpp-home' : '.VPContent'
  );
  if (!content) return;
  content.classList.remove('vpp-route-enter');
  void content.offsetWidth;
  content.classList.add('vpp-route-enter');
  if (transitionTimer) clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => content.classList.remove('vpp-route-enter'), 460);
}

watch(() => route.path, animateRouteContent);
onMounted(animateRouteContent);
onBeforeUnmount(() => {
  if (transitionTimer) clearTimeout(transitionTimer);
});
</script>
