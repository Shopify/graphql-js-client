import assert from 'assert';
import Query from '../src/query';
import variable from '../src/variable';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('query-variables-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter);
  }

  test('it can use variables with fields', () => {
    const variableId = variable('id', 'ID!');

    const query = new Query(typeBundle, [variableId], (root) => {
      root.add('product', {args: {id: variableId}}, (product) => {
        product.add('title');
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query ($id:ID!) {
      product (id: $id) {
        id
        title
      }
    }`));
  });

  test('it can use variables with a default value', () => {
    const variableId = variable('id', 'ID!', '123');

    const query = new Query(typeBundle, [variableId], (root) => {
      root.add('product', {args: {id: variableId}}, (product) => {
        product.add('title');
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query ($id:ID! = "123") {
      product (id: $id) {
        id
        title
      }
    }`));
  });

  test('it can use variables when a query is named', () => {
    const variableId = variable('id', 'ID!');

    const query = new Query(typeBundle, 'bestQueryEver', [variableId], (root) => {
      root.add('product', {args: {id: variableId}}, (product) => {
        product.add('title');
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query bestQueryEver ($id:ID!) {
      product (id: $id) {
        id
        title
      }
    }`));
  });

  test('it can use variables with connections', () => {
    const variableCount = variable('count', 'Int!');
    const variableAfter = variable('after', 'String');

    const query = new Query(typeBundle, [variableCount, variableAfter], (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('products', {args: {first: variableCount, after: variableAfter}}, (product) => {
          product.add('title');
        });
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query ($count:Int! $after:String) {
      shop {
        products (first: $count after: $after) {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              id
              title
            }
          }
        }
      }
    }`));
  });
});
