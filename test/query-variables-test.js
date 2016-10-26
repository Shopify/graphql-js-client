import assert from 'assert';
import Query from '../src/query';
import Variable from '../src/variable';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import noop from '../src/noop';

suite('Unit | Query Variables', () => {
  const querySplitter = /[\s,]+/;

  function splitQuery(query) {
    return query.split(querySplitter);
  }

  test('it can can create variables', () => {
    const query = new Query(typeBundle, noop);
    const variableCountProducts = query.addVariable('countProducts', 'Int!');

    assert.ok(Variable.prototype.isPrototypeOf(variableCountProducts));
  });

  test('it can use variables with fields', () => {
    let queryRoot;

    const query = new Query(typeBundle, (root) => {
      queryRoot = root;
    });

    const variableId = query.addVariable('id', 'ID!');

    queryRoot.addField('product', {id: variableId}, (product) => {
      product.addField('title');
    });

    assert.deepEqual(splitQuery(query.toString()), splitQuery(`query ($id:ID!) {
      product (id: $id) {
        title
      }
    }`));
  });

  test('it can use variables with connections', () => {
    let queryRoot;

    const query = new Query(typeBundle, (root) => {
      queryRoot = root;
    });

    const variableCount = query.addVariable('count', 'Int!');
    const variableAfter = query.addVariable('after', 'String');

    queryRoot.addField('shop', (shop) => {
      shop.addConnection('products', {first: variableCount, after: variableAfter}, (product) => {
        product.addField('title');
      });
    });

    assert.deepEqual(splitQuery(query.toString()), splitQuery(`query ($count:Int! $after:String) {
      shop {
        products (first: $count after: $after) {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              title
            }
          }
        }
      }
    }`));
  });
});
