import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      input: './src',
      outDir: './dist',
      ext: 'js',
    },
  ],
  clean: true,
  declaration: 'node16',
});
