import { defineConfig, rolldownVersion } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  return {
    plugins: [
      react(),
      isLib &&
        dts({
          insertTypesEntry: true,
          include: ["src"],
          // cast rollupOptions for some reason that I don't understand
          rollupOptions: {
            output: {
              assetFileNames: "[name][extname]",
              entryFileNames: "[name].js",
            },
          } as any,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@core": resolve(__dirname, "./src/core"),
        "@commands": resolve(__dirname, "./src/commands"),
        "@components": resolve(__dirname, "./src/components"),
        "@utils": resolve(__dirname, "./src/utils"),
      },
    },
    build: isLib
      ? {
          lib: {
            entry: {
              aphelion: resolve(__dirname, "src/index.ts"),
              vanilla: resolve(__dirname, "src/vanilla.ts"),
            },
            name: "Aphelion",
            formats: ["es"],
            fileName: (format, entryName) =>
              `${entryName}.${format === "es" ? "es.js" : "js"}`,
          },
          ...(rolldownVersion
            ? {
                rolldownOptions: {
                  external: ["react", "react-dom"],
                  output: {
                    globals: {
                      react: "React",
                      "react-dom": "ReactDOM",
                    },
                  },
                },
              }
            : {
                rollupOptions: {
                  external: ["react", "react-dom"],
                  output: {
                    globals: {
                      react: "React",
                      "react-dom": "ReactDOM",
                    },
                    jsx: "transform",
                  },
                },
              }),
        }
      : undefined,
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.test.ts",
          "**/*.test.tsx",
        ],
      },
    },
  };
});
