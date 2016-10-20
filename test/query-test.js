import assert from 'assert';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('Unit | Query', () => {
  const querySplitter = /[\s,]+/;

  function splitQuery(query) {
    return query.split(querySplitter);
  }

  test('it builds queries off the root', () => {
    const query = new Query(typeBundle);

    assert.deepEqual(splitQuery(query.toQuery()), splitQuery('query { }'));
  });

  test('it builds queries off the passed type', () => {
    const query = new Query(typeBundle, 'Shop');

    assert.deepEqual(splitQuery(query.toQuery()), splitQuery('fragment on Shop { }'));
  });

  test('it can add basic fields', () => {
    const query = new Query(typeBundle, 'Shop');

    query.addField('name');

    assert.deepEqual(splitQuery(query.toQuery()), splitQuery('fragment on Shop { name }'));
  });

  test('it yields an instance of Query representing the type passed to addField', () => {
    const query = new Query(typeBundle);

    query.addField('shop', {}, (shop) => {
      assert.ok(Query.prototype.isPrototypeOf(shop));
    });
  });

  test('it doesn\'t require query args when using addField or addConnection', () => {
    const query = new Query(typeBundle);
    let addFieldCalledCallBack = false;

    query.addField('shop', () => {
      addFieldCalledCallBack = true;
    });

    assert.ok(addFieldCalledCallBack, 'addField called callback even if args wasn\'t passed');
  });

  test('it doesn\'t require query args when using addConnection', () => {
    const query = new Query(typeBundle, 'Shop');
    let addConnectionCalledCallBack = false;

    query.addConnection('collections', () => {
      addConnectionCalledCallBack = true;
    });

    assert.ok(addConnectionCalledCallBack, 'addConnection called callback even if args wasn\'t passed');
  });

  test('it composes nested querys', () => {
    const query = new Query(typeBundle);

    query.addField('shop', {}, (shop) => {
      shop.addField('name');
    });

    assert.deepEqual(splitQuery(query.toQuery()), splitQuery('query { shop { name } }'));
  });

  test('it can attach args to nested nodes', () => {
    const query = new Query(typeBundle);

    query.addField('product', {id: '1'}, (shop) => {
      shop.addField('title');
    });

    assert.deepEqual(splitQuery(query.toQuery()), splitQuery('query { product (id: "1") { title } }'));
  });

  test('it adds connections with pagination info', () => {
    const query = new Query(typeBundle);

    query.addField('shop', {}, (shop) => {
      shop.addField('name');
      shop.addConnection('products', {first: 10}, (product) => {
        product.addField('handle');
      });
    });

    assert.deepEqual(splitQuery(query.toQuery()), splitQuery(`query {
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
    const query = new Query(typeBundle);

    query.addField('shop', {}, (shop) => {
      shop.addInlineFragmentOn('Shop', (fragment) => {
        fragment.addField('name');
      });
    });

    assert.deepEqual(splitQuery(query.toQuery()), splitQuery(`query {
      shop {
        ... on Shop {
          name
        }
      }
    }`));
  });


});
