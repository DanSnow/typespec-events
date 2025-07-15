import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://dansnow.github.io',
  base: process.env.NODE_ENV === 'production' ? '/typespec-events' : '/',

  integrations: [
    starlight({
      title: 'Typespec Events',
      description: 'Standardize and Improve Tracking Event Management',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/withastro/starlight',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/DanSnow/hoarder-pipette/edit/main/docs/',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Getting Started', slug: 'guides/getting-started' },
            { label: 'Concepts', slug: 'guides/concepts' },
            { label: 'Defining Complex Schemas', slug: 'guides/defining-complex-schemas' },
            { label: 'Emitter Options', slug: 'guides/emitter-options' },
            { label: 'Integration Examples', slug: 'guides/integration-examples' },
            { label: 'Contributing', slug: 'guides/contributing' },
          ],
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
