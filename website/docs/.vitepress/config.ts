import { defineConfig } from 'vitepress';
import mathjax3 from 'markdown-it-mathjax3';
export default defineConfig({
  title: 'Viable Prompt Protocol (VPP)',
  description: 'A tag-first protocol for structuring multi-turn conversations between humans and LLMs.',
  base: '/viable-prompt-protocol/',
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(mathjax3);
    }
  },
  editLink: {
    pattern: 'https://github.com/cbassuarez/viable-prompt-protocol/edit/main/website/docs/:path'
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Spec', link: '/spec/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Experiments', link: '/experiments/' },
      { text: 'Corpus', link: '/corpus/' },
      { text: 'Validator & CI', link: '/validator/' },
      { text: 'Changelog', link: '/changelog/' },
      { text: 'FAQ', link: '/faq/' }
    ],
    sidebar: {
      '/spec/': [
        {
          text: 'Specification',
          items: [
            { text: 'Introduction', link: '/spec/#introduction' },
            { text: 'Scope and terminology', link: '/spec/#scope-and-terminology' },
            { text: 'Command line grammar', link: '/spec/#command-line-grammar' },
            { text: 'Tags', link: '/spec/#tags' },
            { text: 'Modifiers', link: '/spec/#modifiers' },
            { text: 'Pipelines and loci', link: '/spec/#pipelines-and-loci' },
            { text: 'Error modes and recovery', link: '/spec/#error-modes-and-recovery' },
            { text: 'Compliance footer', link: '/spec/#compliance-footer' },
            { text: 'Examples', link: '/spec/#examples' },
            { text: 'Versioning', link: '/spec/#versioning' }
          ]
        }
      ],
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Tags and loci', link: '/guide/#tags-and-loci' },
            { text: 'Modifiers', link: '/guide/#modifiers' },
            { text: 'Pipelines and cycles', link: '/guide/#pipelines-and-cycles' },
            { text: 'Error modes', link: '/guide/#error-modes' },
            { text: 'Implementation notes', link: '/guide/#implementation-notes' }
          ]
        }
      ],
      '/experiments/': [
        {
          text: 'Experiments',
          items: [
            { text: 'Overview', link: '/experiments/' },
            { text: 'Summary', link: '/experiments/summary' },
            { text: 'Exp-01', link: '/experiments/exp-01' },
            { text: 'Exp-02', link: '/experiments/exp-02' },
            { text: 'Exp-01b', link: '/experiments/exp-01b' }
          ]
        }
      ],
      '/corpus/': [
        {
          text: 'Corpus',
          items: [
            { text: 'Overview', link: '/corpus/' }
          ]
        }
      ],
      '/validator/': [
        {
          text: 'Validator & CI',
          items: [
            { text: 'Checks', link: '/validator/' }
          ]
        }
      ]
    }
  }
});
