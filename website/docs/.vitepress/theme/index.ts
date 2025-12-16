import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import CorpusViewer from './components/CorpusViewer.vue';
import Layout from './Layout.vue';
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
