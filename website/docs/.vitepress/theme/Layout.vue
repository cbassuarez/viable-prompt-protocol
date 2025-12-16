<template>
  <div class="vpp-layout">
    <div class="vpp-announcement-bar">
      <span class="vpp-announcement-label">VPPChat beta is live.</span>
      <a class="vpp-announcement-link" href="https://testflight.apple.com/join/EXAMPLE">
        Join on TestFlight →
      </a>
    </div>
    <Layout />
  </div>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';

const { Layout } = DefaultTheme;
</script>
