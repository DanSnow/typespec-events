import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME } from '../src/consts.js';
import { emit } from './test-host.js';

describe('go emitter', () => {
  it('emit events.go with camelCase (default)', async () => {
    const results = await emit('@event("cta_clicked") model CtaClicked { title: string }', {
      options: {
        [PACKAGE_NAME]: {
          languages: ['go'],
        },
      },
    });
    expect(results['events.go']).toMatchSnapshot();
  });

  it('emit events.go with PascalCase', async () => {
    const results = await emit('@event("cta_clicked") model CtaClicked { title: string }', {
      options: {
        [PACKAGE_NAME]: {
          languages: ['go'],
          schemaNamingConvention: 'PascalCase',
        },
      },
    });
    expect(results['events.go']).toMatchSnapshot();
  });

  it('emit nested models in correct order', async () => {
    const results = await emit(
      `
      model City { name: string, zip: int32 }
      model Address { street: string, city: City }
      @event("user_address_updated")
      model UserAddressUpdated { userId: string, address: Address }
    `,
      {
        options: {
          [PACKAGE_NAME]: {
            languages: ['go'],
          },
        },
      },
    );
    expect(results['events.go']).toMatchSnapshot();
  });
});
