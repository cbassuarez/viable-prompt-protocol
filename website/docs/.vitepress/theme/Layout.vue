<template>
  <div class="vpp-layout">
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
