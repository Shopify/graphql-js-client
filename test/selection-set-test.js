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

    set.addField('name');

    assert.deepEqual(tokens(set.toString()), tokens(' { name }'));
  });

  test('addField yields another instance of SelectionSet representing the type of the field', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    set.addField('shop', {}, (shop) => {
      assert.equal(typeBundle.Shop, shop.typeSchema);
      assert.ok(SelectionSet.prototype.isPrototypeOf(shop));
    });
  });

  test('it doesn\'t require field args when using addField', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');
    let addFieldCalledCallBack = false;

    set.addField('shop', () => {
      addFieldCalledCallBack = true;
    });

    assert.ok(addFieldCalledCallBack, 'addField called callback even if args wasn\'t passed');
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

    set.addField('shop', {}, (shop) => {
      shop.addField('name');
    });

    assert.deepEqual(tokens(set.toString()), tokens(' { shop { name } }'));
  });

  test('it can attach args to nested nodes', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    set.addField('product', {id: '1'}, (product) => {
      product.addField('title');
    });

    assert.deepEqual(tokens(set.toString()), tokens(' { product (id: "1") { title } }'));
  });

  test('it adds connections with pagination info', () => {
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    set.addField('shop', {}, (shop) => {
      shop.addField('name');
      shop.addConnection('products', {first: 10}, (product) => {
        product.addField('handle');
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

    set.addField('shop', {}, (shop) => {
      shop.addInlineFragmentOn('Shop', (fragment) => {
        fragment.addField('name');
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

        set.addField('shop', (shop) => {
          shop.addField('name');
          shop.addField('name');
        });
      },
      /The field 'name' has already been added/
    );
  });

  test('it can add a field with SelectionSet', () => {
    const shop = new SelectionSet(typeBundle, 'Shop');
    const set = new SelectionSet(typeBundle, 'QueryRoot');

    shop.addField('name');
    shop.addConnection('products', {first: 10}, (products) => {
      products.addField('handle');
    });

    set.addField('shop', shop);

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

    productConnection.addField('pageInfo', (pageInfo) => {
      pageInfo.addField('hasNextPage');
      pageInfo.addField('hasPreviousPage');
    });
    set.addField('products', {first: 10}, productConnection);

    assert.deepEqual(tokens(set.toString()), tokens(` {
      products (first: 10) {
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }`));
  });

  test('it can add basic fields using shorthand add', () => {
    const set = new SelectionSet(typeBundle, 'Shop');

    set.add('name');

    assert.deepEqual(tokens(set.toString()), tokens(` {
      name
    }`));
  });

  test('it yields another instance of SelectionSet when using add', () => {
    const set = new SelectionSet(typeBundle, 'Shop');
    let returnedSet;

    set.add('billingAddress', (billingAddress) => {
      returnedSet = billingAddress;
    });

    assert.ok(SelectionSet.prototype.isPrototypeOf(returnedSet));
    assert.equal(typeBundle.Address, returnedSet.typeSchema);
  });

  test('it yields a SelectionSet representing a node when add is used on a connection', () => {
    const set = new SelectionSet(typeBundle, 'Shop');
    let returnedSet;

    set.add('products', (products) => {
      returnedSet = products;
    });

    assert.ok(SelectionSet.prototype.isPrototypeOf(returnedSet));
    assert.equal(typeBundle.Product, returnedSet.typeSchema);
  });

  test('it can use use field args when using add', () => {
    const set = new SelectionSet(typeBundle, 'Shop');

    set.add('products', {first: 33}, (products) => {
      products.addField('title');
    });

    assert.deepEqual(tokens(set.toString()), tokens(`{
      products (first: 33) {
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
        edges {
          cursor,
          node {
            title
          }
        }
      }
    }`));
  });

  test('it can use an existing SelectionSet when adding a field using add', () => {
    const set = new SelectionSet(typeBundle, 'Shop');
    const addressSet = new SelectionSet(typeBundle, 'Address');

    addressSet.addField('city');
    set.add('billingAddress', addressSet);

    assert.deepEqual(tokens(set.toString()), tokens(`{
      billingAddress {
        city
      }
    }`));
  });
});
