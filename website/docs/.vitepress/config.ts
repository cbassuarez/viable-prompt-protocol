import { defineConfig } from 'vitepress';
import mathjax3 from 'markdown-it-mathjax3';

const base = '/';

export default defineConfig({
  title: 'Viable Prompt Protocol (VPP)',
  description: 'A portable skill and deterministic runtime for auditable, tagged LLM conversations.',
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
      { text: 'Home', link: '/' },
      { text: 'Install', link: '/install/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Spec v1.5', link: '/spec/' },
      {
        text: 'More',
        items: [
          { text: 'Why VPP', link: '/why-vpp' },
          { text: 'Reduced-assurance fallback', link: '/custom-instructions/' },
          { text: 'Validator & CI', link: '/validator/' },
          { text: 'Support', link: '/support/' },
          { text: 'Experiments', link: '/experiments/' },
          { text: 'Corpus', link: '/corpus/' },
          { text: 'Changelog', link: '/changelog/' },
          { text: 'FAQ', link: '/faq/' }
        ]
      }
    ],
    sidebar: {
      '/spec/': [
        {
          text: 'Specification',
          items: [
            { text: 'Grammar', link: '/spec/#grammar' },
            { text: 'Transitions', link: '/spec/#transitions' },
            { text: 'State', link: '/spec/#state' },
            { text: 'Content contracts', link: '/spec/#content-contracts' },
            { text: 'Footer', link: '/spec/#footer' }
          ]
        }
      ],
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Start a conversation', link: '/guide/#start-a-conversation' },
            { text: 'Tags and contracts', link: '/guide/#tags-and-content-contracts' },
            { text: 'Counters and cycles', link: '/guide/#counters-cycles-and-loci' },
            { text: 'Modifiers and recovery', link: '/guide/#modifiers-and-recovery' },
            { text: 'Implementation options', link: '/guide/#implementation-options' }
          ]
        }
      ],
      '/install/': [
        {
          text: 'Install VPP',
          items: [
            { text: 'Codex and ChatGPT', link: '/install/#codex-and-chatgpt-desktop' },
            { text: 'Download bundle', link: '/install/#download-the-portable-bundle' },
            { text: 'Remote MCP', link: '/install/#connect-the-remote-mcp-server' },
            { text: 'JSON and OpenAPI', link: '/install/#use-the-json-or-openapi-api' },
            { text: 'Secondary methods', link: '/install/#secondary-methods' }
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
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/cbassuarez/viable-prompt-protocol' }
    ],
    footer: {
      message: 'VPP v1.5 · portable skill + deterministic runtime · published by Seb Suarez.',
      copyright: 'MIT code · CC BY 4.0 documentation and examples · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a> · <a href="/support/">Support</a>'
    }
  }
});
