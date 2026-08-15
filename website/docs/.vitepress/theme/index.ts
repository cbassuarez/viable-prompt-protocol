import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import CorpusViewer from './components/CorpusViewer.vue';
import Layout from './Layout.vue';
import '@fontsource-variable/archivo/index.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import 'lenis/dist/lenis.css';
import './style.css';

const theme: Theme = {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    DefaultTheme.enhanceApp?.({ app });
    app.component('CorpusViewer', CorpusViewer);
  }
};

export default theme;
