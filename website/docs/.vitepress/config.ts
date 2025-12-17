import { defineConfig } from 'vitepress';
import mathjax3 from 'markdown-it-mathjax3';

const base = '/viable-prompt-protocol/';

export default defineConfig({
  title: 'Viable Prompt Protocol (VPP)',
  description: 'A tag-first protocol for structuring multi-turn conversations between humans and LLMs.',
  base,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: `${base}vppchat_icon.png?v=1` }],
    ['link', { rel: 'shortcut icon', type: 'image/png', href: `${base}vppchat_icon.png?v=1` }],
    ['link', { rel: 'apple-touch-icon', href: `${base}vppchat_icon.png?v=1` }]
  ],
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
      { text: 'Get VPPChat', link: '/vppchat/' },
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
            { text: 'Exp-01', link: '/experiments/exp-01' },
            { text: 'Exp-02', link: '/experiments/exp-02' },
            { text: 'Exp-01b', link: '/experiments/exp-01b' },
            { text: 'Exp-03', link: '/experiments/exp-03' },
            { text: 'Summary I: Exp01-03', link: '/experiments/summary-01' },
            { text: 'Exp-04', link: '/experiments/exp-04' },
            { text: 'Exp-05', link: '/experiments/exp-05' },
            { text: 'Exp-06', link: '/experiments/exp-06' },
            { text: 'Summary II: Exp04-06', link: '/experiments/summary-02' },

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
      ],
      '/vppchat/': [
        {
          text: 'VPPChat',
          items: [
            { text: 'VPPChat', link: '/vppchat/' },
            { text: 'Release notes', link: '/vppchat/release-notes' },
            { text: 'Privacy', link: '/vppchat/privacy' },
            { text: 'Roadmap', link: '/vppchat/roadmap' }
          ]
        }
      ]
    }
  }
});
