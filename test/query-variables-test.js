import assert from 'assert';
import Query from '../src/query';
import variable, {VariableDefinition} from '../src/variable';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('Unit | Query Variables', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter);
  }

  test('it can create variables', () => {
    const variableId = variable('id', 'ID!');

    assert.ok(VariableDefinition.prototype.isPrototypeOf(variableId));
  });

  test('it can use variables with fields', () => {
    const variableId = variable('id', 'ID!');

    const query = new Query(typeBundle, [variableId], (root) => {
      root.addField('product', {id: variableId}, (product) => {
        product.addField('title');
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query ($id:ID!) {
      product (id: $id) {
        title
      }
    }`));
  });

  test('it can use variables when a query is named', () => {
    const variableId = variable('id', 'ID!');

    const query = new Query(typeBundle, 'bestQueryEver', [variableId], (root) => {
      root.addField('product', {id: variableId}, (product) => {
        product.addField('title');
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query bestQueryEver ($id:ID!) {
      product (id: $id) {
        title
      }
    }`));
  });

  test('it can use variables with connections', () => {
    const variableCount = variable('count', 'Int!');
    const variableAfter = variable('after', 'String');

    const query = new Query(typeBundle, [variableCount, variableAfter], (root) => {
      root.addField('shop', (shop) => {
        shop.addConnection('products', {first: variableCount, after: variableAfter}, (product) => {
          product.addField('title');
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
              title
            }
          }
        }
      }
    }`));
  });
});
