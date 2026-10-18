import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: ['../src/components/ui/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins || []), tailwindcss()];
    return config;
  },
};

export default config;
