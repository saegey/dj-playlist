import { defineConfig, createSystem, defaultConfig } from "@chakra-ui/react";
const config = defineConfig({
  globalCss: {
    html: {
      // colorPalette: "black", // Change this to any color palette you prefer
    },
  },
  theme: {
    semanticTokens: {
      colors: {
        // The app's one accent: active filters, primary actions, playback progress.
        accent: {
          solid: { value: "{colors.blue.solid}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
