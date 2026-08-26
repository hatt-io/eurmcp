import { readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';
import type { DefaultTheme } from 'vitepress';
import type MarkdownIt from 'markdown-it';
import type { StateCore, StateInline } from 'markdown-it';

const base = '/eurmcp/';
const vaultRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const naturalOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const baseViews = new Map([
  ['Tool Catalog.base', '02 Reference/MCP Tools'],
  ['02 Reference/Tool Catalog.base', '02 Reference/MCP Tools'],
  ['Improvement Specs.base', '06 Roadmap/Best-in-Class Specification'],
  ['06 Roadmap/Improvement Specs.base', '06 Roadmap/Best-in-Class Specification']
]);

function navigationLabel(name: string): string {
  return name.replace(/\.md$/i, '').replace(/^\d+\s+/, '');
}

function vaultItems(directory: string): DefaultTheme.SidebarItem[] {
  const entries = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => entry.isDirectory() || entry.name.endsWith('.md'))
    .sort((left, right) => {
      if (left.isDirectory() !== right.isDirectory()) return left.isDirectory() ? 1 : -1;
      return naturalOrder.compare(left.name, right.name);
    });

  return entries.map((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return {
        text: navigationLabel(entry.name),
        collapsed: directory === vaultRoot ? entry.name !== '01 User Guide' : true,
        items: vaultItems(absolutePath)
      };
    }

    const vaultPath = relative(vaultRoot, absolutePath).split(sep).join('/');
    return {
      text: navigationLabel(entry.name),
      link: `/${vaultPath.replace(/\.md$/i, '')}`
    };
  });
}

function vaultSidebar(): DefaultTheme.SidebarItem[] {
  return [
    { text: 'Overview', link: '/' },
    ...vaultItems(vaultRoot).filter((item) => item.link !== '/Home')
  ];
}

function headingAnchor(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function wikiHref(rawTarget: string): string {
  const [rawPath, rawHeading] = rawTarget.split('#', 2);
  let path = rawPath.trim().replace(/\.md$/i, '');
  path = baseViews.get(path) ?? path;

  const anchor = rawHeading ? `#${headingAnchor(rawHeading)}` : '';
  if (path === 'Home' || path === '') return `/${anchor}`;

  return `/${path}.md${anchor}`;
}

function obsidianMarkdown(md: MarkdownIt): void {
  md.core.ruler.before('normalize', 'obsidian-callouts', (state: StateCore) => {
    state.src = state.src.replace(
      /^>\s*\[!(note|tip|important|warning|caution)\][+-]?\s*(.*)$/gim,
      (_match: string, kind: string, title: string) =>
        `> **${title.trim() || kind[0].toUpperCase() + kind.slice(1)}**`
    );
  });

  md.inline.ruler.before('link', 'obsidian-wikilink', (state: StateInline, silent: boolean) => {
    const start = state.pos;
    if (state.src.slice(start, start + 2) !== '[[') return false;

    const end = state.src.indexOf(']]', start + 2);
    if (end < 0) return false;

    const raw = state.src.slice(start + 2, end);
    const separator = raw.indexOf('|');
    const target = (separator >= 0 ? raw.slice(0, separator) : raw).trim();
    const label = (
      separator >= 0 ? raw.slice(separator + 1) : (target.split('/').pop() ?? target)
    ).trim();
    if (!target) return false;

    if (!silent) {
      const open = state.push('link_open', 'a', 1);
      open.attrs = [['href', wikiHref(target)]];
      const text = state.push('text', '', 0);
      text.content = label.replace(/\.base$/i, '');
      state.push('link_close', 'a', -1);
    }

    state.pos = end + 2;
    return true;
  });
}

export default defineConfig({
  title: 'eu-law-mcp',
  description: 'Source-grounded MCP tools for authoritative EU law and case law',
  lang: 'en-GB',
  base,
  lastUpdated: true,
  cleanUrls: false,
  rewrites: {
    'Home.md': 'index.md'
  },
  head: [
    ['meta', { name: 'theme-color', content: '#123a72' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'eu-law-mcp documentation' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Authoritative EU law, grounded in official sources'
      }
    ],
    ['meta', { property: 'og:image', content: 'https://hatt-io.github.io/eurmcp/og.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'eu-law-mcp documentation' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content: 'Authoritative EU law, grounded in official sources'
      }
    ],
    ['meta', { name: 'twitter:image', content: 'https://hatt-io.github.io/eurmcp/og.png' }]
  ],
  markdown: {
    config: obsidianMarkdown
  },
  themeConfig: {
    siteTitle: 'eu-law-mcp',
    logo: {
      light: '/eurmcp/mark-light.svg',
      dark: '/eurmcp/mark-dark.svg',
      alt: 'eu-law-mcp'
    },
    nav: [
      { text: 'Guide', link: '/01 User Guide/Getting Started' },
      { text: 'Reference', link: '/02 Reference/MCP Tools' },
      { text: 'Architecture', link: '/03 Internals/Architecture' },
      { text: 'Roadmap', link: '/06 Roadmap/Roadmap' }
    ],
    sidebar: vaultSidebar(),
    search: {
      provider: 'local'
    },
    outline: {
      level: [2, 3],
      label: 'On this page'
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/hatt-io/eurmcp' }],
    editLink: {
      pattern: 'https://github.com/hatt-io/eurmcp/edit/main/eurmcp/:path',
      text: 'Edit this page on GitHub'
    },
    footer: {
      message: 'Authoritative sources in. Verifiable legal material out.',
      copyright: 'Released under the MIT License.'
    },
    docFooter: {
      prev: 'Previous',
      next: 'Next'
    }
  }
});
