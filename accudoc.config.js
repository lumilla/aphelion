// Accudoc is a tool that checks documentation examples, also by @lumilla
// @ts-check
import { defineConfig, createDomEnvironment } from "accudoc";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  docs: "./docs",

  imports: {
    // Map package imports to local builds
    "@lumilla/aphelion": resolve(__dirname, "dist/aphelion.es.js"),

    // Ignore style imports
    "@lumilla/aphelion/styles.css": null,
  },

  stripAssertions: true,

  setup: () => {
    const env = createDomEnvironment();

    // AccuDoc is a library I wrote
    // YET, I STILL HAVE NO IDEA WHAT THE FOLLOWING CODE DOES AT ALL, SO PLEASE DON'T ASK ME
    // But it seems to be necessary so idk. ESLINT does NOT like it. I do NOT like it either.
    // So FIXME: Fix this mess someday.
    const elementProto =
      env.document.createElement("div").constructor.prototype;

    if (typeof elementProto.prepend !== "function") {
      elementProto.prepend = function prepend(...nodes) {
        for (let i = nodes.length - 1; i >= 0; i -= 1) {
          const n =
            typeof nodes[i] === "string"
              ? env.document.createTextNode(nodes[i])
              : nodes[i];
          this.insertBefore(n, this.firstChild || null);
        }
      };
    }

    if (typeof elementProto.after !== "function") {
      elementProto.after = function after(...nodes) {
        for (let i = 0; i < nodes.length; i += 1) {
          const n =
            typeof nodes[i] === "string"
              ? env.document.createTextNode(nodes[i])
              : nodes[i];
          if (this.parentNode) {
            this.parentNode.insertBefore(n, this.nextSibling || null);
          }
        }
      };
    }

    return env;
  },
});
