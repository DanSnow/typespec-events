import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const playgroundRoot = join(__dirname, '..');
const outputDir = join(playgroundRoot, 'tsp-output', '@typespec-events', 'typespec');

describe('Playground Integration Tests', () => {
  it('should generate the expected output file', () => {
    const generatedFilePath = join(outputDir, 'events.zod.ts'); // Assuming Zod emitter output

    // Read the generated file content
    const generatedContent = readFileSync(generatedFilePath, 'utf-8');

    expect(generatedContent.trim()).toMatchSnapshot();
  });
});
