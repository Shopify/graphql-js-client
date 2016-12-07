import assert from 'assert';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import {resetProfiler, startProfiling, pauseProfiling, profiledTypes, printTypes} from '../src/type-profiler';

suite('type-profiler-test', () => {
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

    assert.deepEqual(profiledTypes(), [
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

  test('it pauses profiling when `pauseProfiling` is called', () => {
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

    assert.deepEqual(profiledTypes(), [
      'ID',
      'Node',
      'QueryRoot',
      'Shop',
      'String'
    ]);
  });

  test('it clears the profiled types when `resetProfiler` is called', () => {
    startProfiling();

    // eslint-disable-next-line no-new
    new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
      });
    });

    resetProfiler();

    assert.deepEqual(profiledTypes(), []);
  });

  test('it logs the profiled types when `printTypes` is called', () => {
    startProfiling();

    // eslint-disable-next-line no-new
    new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
      });
    });

    let loggedTypes;

    // eslint-disable-next-line
    console.log = function (types) {
      loggedTypes = types;
    };

    printTypes();

    assert.deepEqual(loggedTypes, [
      'QueryRoot',
      'Shop',
      'String'
    ]);
  });
});
