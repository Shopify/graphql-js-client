import assert from 'assert';
import SelectionSet from '../src/selection-set';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('selection-set-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  test('it builds sets using the passed type', () => {
    const set = new SelectionSet(typeBundle, 'Shop');

    assert.deepEqual(typeBundle.Shop, set.typeSchema);
    assert.deepEqual(tokens(set.toString()), tokens(' { }'));
  });

  test('it can add basic fields', () => {
    const set = new SelectionSet(typeBundle, 'Shop');

    set.add('name');

    assert.deepEqual(tokens(set.toString()), tokens(' { name }'));
  });

  test('add yields another instance of SelectionSet representing the type of the field', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    set.add('shop', {}, (shop) => {
      assert.equal(typeBundle.Shop, shop.typeSchema);
      assert.ok(SelectionSet.prototype.isPrototypeOf(shop));
    });
  });

  test('it doesn\'t require field args when using add or addConnection', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');
    let addCalledCallBack = false;

    set.add('shop', () => {
      addCalledCallBack = true;
    });

    assert.ok(addCalledCallBack, 'add called callback even if args wasn\'t passed');
  });

  test('it doesn\'t require query args when using addConnection', () => {
    const set = new SelectionSet(typeBundle, 'Shop');
    let addConnectionCalledCallBack = false;

    set.addConnection('collections', () => {
      addConnectionCalledCallBack = true;
    });

    assert.ok(addConnectionCalledCallBack, 'addConnection called callback even if args wasn\'t passed');
  });

  test('it composes nested querys', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    set.add('shop', {}, (shop) => {
      shop.add('name');
    });

    assert.deepEqual(tokens(set.toString()), tokens(' { shop { name } }'));
  });

  test('it can attach args to nested nodes', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    set.add('product', {id: '1'}, (product) => {
      product.add('title');
    });

    assert.deepEqual(tokens(set.toString()), tokens(' { product (id: "1") { title } }'));
  });

  test('it adds connections with pagination info', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    set.add('shop', {}, (shop) => {
      shop.add('name');
      shop.addConnection('products', {first: 10}, (product) => {
        product.add('handle');
      });
    });

    assert.deepEqual(tokens(set.toString()), tokens(` {
      shop {
        name,
        products (first: 10) {
          pageInfo {
            hasNextPage,
            hasPreviousPage
          },
          edges {
            cursor,
            node {
              handle
            }
          }
        }
      }
    }`));
  });

  test('it adds inline fragments', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    set.add('shop', {}, (shop) => {
      shop.addInlineFragmentOn('Shop', (fragment) => {
        fragment.add('name');
      });
    });

    assert.deepEqual(tokens(set.toString()), tokens(`{
      shop {
        ... on Shop {
          name
        }
      }
    }`));
  });

  test('it cannot add the same field twice', () => {
    assert.throws(
      () => {
        const set = new SelectionSet(typeBundle, 'QueryRoot');

        set.add('shop', (shop) => {
          shop.add('name');
          shop.add('name');
        });
      },
      /The field 'name' has already been added/
    );
  });

  test('it can add a field with SelectionSet', () => {
    const shop = new SelectionSet(typeBundle, 'Shop');
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    shop.add('name');
    shop.addConnection('products', {first: 10}, (products) => {
      products.add('handle');
    });

    set.add('shop', shop);

    assert.deepEqual(tokens(set.toString()), tokens(` {
      shop {
        name
        products (first: 10) {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor,
            node {
              handle
            }
          }
        }
      }
    }`));
  });

  test('it can add a field with SelectionSet using args', () => {
    const set = new SelectionSet(typeBundle, 'Shop');
    const productConnection = new SelectionSet(typeBundle, 'ProductConnection');

    productConnection.add('pageInfo', (pageInfo) => {
      pageInfo.add('hasNextPage');
      pageInfo.add('hasPreviousPage');
    });
    set.add('products', {first: 10}, productConnection);

    assert.deepEqual(tokens(set.toString()), tokens(` {
      products (first: 10) {
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }`));
  });
});
