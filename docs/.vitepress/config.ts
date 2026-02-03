import { defineConfig } from "vitepress";
import { accudocTransformer } from "accudoc/vitepress";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  title: "Aphelion",
  description: "LaTeX-based math input library for the web",
  base: "/aphelion/",

  markdown: {
    // Strip doctest-hidden lines from rendered code blocks
    codeTransformers: [accudocTransformer],
  },

  vite: {
    resolve: {
      alias: [
        {
          find: "@lumilla/aphelion/styles.css",
          replacement: resolve(__dirname, "../../dist/styles.css"),
        },
        {
          find: "@lumilla/aphelion",
          replacement: resolve(__dirname, "../../dist/vanilla.es.js"),
        },
      ],
    },
  },

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "Demo", link: "/demo" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Aphelion?", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Usage",
          items: [
            { text: "Vanilla JavaScript", link: "/guide/vanilla-js" },
            { text: "React", link: "/guide/react" },
            { text: "Configuration", link: "/guide/configuration" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "LaTeX Commands", link: "/guide/latex-commands" },
            { text: "Event Handlers", link: "/guide/event-handlers" },
            { text: "Styling", link: "/guide/styling" },
            { text: "Troubleshooting", link: "/guide/troubleshooting" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api/" },
            { text: "Aphelion Interface", link: "/api/aphelion" },
            { text: "MathField", link: "/api/mathfield" },
            { text: "StaticMath", link: "/api/staticmath" },
            { text: "React Components", link: "/api/react-components" },
            { text: "Configuration", link: "/api/configuration" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/lumilla/aphelion" },
      { icon: "npm", link: "https://www.npmjs.com/package/@lumilla/aphelion" },
    ],

    footer: {
      message:
        'Released under the <a href="https://github.com/lumilla/aphelion/blob/main/LICENSE">LGPL-3.0 License</a>.',
      copyright: `Copyright © ${new Date().getFullYear()} Lumilla`,
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern: "https://github.com/lumilla/aphelion/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
