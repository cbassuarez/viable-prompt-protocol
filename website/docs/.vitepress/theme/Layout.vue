<template>
  <div class="vpp-layout">
    <div class="vpp-announcement-bar">
      <span class="vpp-announcement-label">VPPChat beta is live.</span>
      <a class="vpp-announcement-link" href="https://testflight.apple.com/join/EXAMPLE">
        Join on TestFlight →
      </a>
    </div>
    <transition name="vpp-page-fade" mode="out-in">
      <Layout :key="route.path" />
    </transition>
  </div>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import { useRoute } from 'vitepress';

const { Layout } = DefaultTheme;
const route = useRoute();
</script>
