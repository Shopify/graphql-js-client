import assert from 'assert';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import {resetProfiler, startProfiling, pauseProfiling, captureTypeProfile} from '../src/profile-schema-usage';

suite('profile-schema-usage-test', () => {
  setup(() => {
    resetProfiler();
  });

  test('it reports the types used in a query', () => {
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

    assert.deepEqual(captureTypeProfile(), [
      'Boolean',
      'ID',
      'Money',
      'PageInfo',
      'Product',
      'ProductConnection',
      'ProductEdge',
      'ProductVariant',
      'ProductVariantConnection',
      'ProductVariantEdge',
      'QueryRoot',
      'Shop',
      'String'
    ]);
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

    assert.deepEqual(captureTypeProfile(), [
      'ID',
      'Node',
      'QueryRoot',
      'Shop',
      'String'
    ]);
  });

  test('it clears the tracked types when `resetProfiler` is called', () => {
    startProfiling();

    // eslint-disable-next-line no-new
    new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
      });
    });

    resetProfiler();

    assert.deepEqual(captureTypeProfile(), []);
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

    assert.deepEqual(captureTypeProfile(), []);
  });
});
