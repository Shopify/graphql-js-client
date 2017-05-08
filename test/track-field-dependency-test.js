import assert from 'assert';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import {resetProfiler, startProfiling, pauseProfiling, captureProfile} from '../src/profile-schema-usage';

suite('track-field-dependency-test', () => {
  setup(() => {
    resetProfiler();
  });

  test('it reports the fields used in a query', () => {
    startProfiling();

    // eslint-disable-next-line no-new
    new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
        shop.addConnection('products', (products) => {
          products.add('handle');
          products.addConnection('variants', (variants) => {
            variants.add('price');
          });
        });
      });
    });

    assert.deepEqual(captureProfile(), {
      Boolean: [],
      ID: [],
      Money: [],
      String: [],
      QueryRoot: [
        'shop'
      ],
      Shop: [
        'name',
        'products'
      ],
      PageInfo: [
        'hasNextPage',
        'hasPreviousPage'
      ],
      ProductConnection: [
        'pageInfo',
        'edges'
      ],
      ProductEdge: [
        'cursor',
        'node'
      ],
      Product: [
        'handle',
        'variants'
      ],
      ProductVariantConnection: [
        'pageInfo',
        'edges'
      ],
      ProductVariantEdge: [
        'cursor',
        'node'
      ],
      ProductVariant: [
        'price'
      ]
    });
  });

  test('it pauses tracking when `pauseProfiling` is called', () => {
    startProfiling();

    // eslint-disable-next-line no-new
    new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
      });
    });

    pauseProfiling();

    // eslint-disable-next-line no-new
    new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
        shop.addConnection('products', (products) => {
          products.add('handle');
          products.addConnection('variants', (variants) => {
            variants.add('price');
          });
        });
      });
    });

    startProfiling();

    // eslint-disable-next-line no-new
    new Query(typeBundle, (root) => {
      root.add('node', {id: 'gid://shopfiy/Product/1234'}, (node) => {
        node.add('id');
      });
    });

    assert.deepEqual(captureProfile(), {
      ID: [],
      String: [],
      QueryRoot: [
        'shop',
        'node'
      ],
      Shop: [
        'name'
      ],
      Node: [
        'id'
      ]
    });
  });

  test('it stops tracking when `resetTypes` is called (returning the tracker to it\'s initial state.', () => {
    startProfiling();

    resetProfiler();

    // eslint-disable-next-line no-new
    new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
      });
    });

    assert.deepEqual(captureProfile(), {});
  });
});
