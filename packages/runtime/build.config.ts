import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    {
      builder: 'rollup',
      input: './src/index.ts',
    },
  ],
  clean: true,
  declaration: 'node16',
});
