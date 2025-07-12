import { describe, expect, it } from 'vitest';
import { emit } from './test-host.js';

describe('hello', () => {
  it('emit output.txt with content hello world', async () => {
    const results = await emit('op test(): void;');
    expect(results['output.txt']).toBe('Hello world\n');
  });
});
