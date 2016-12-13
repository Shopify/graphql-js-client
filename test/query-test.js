import assert from 'assert';
import assertDeeplyFrozen from './assert-deeply-frozen';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import variable from '../src/variable';

suite('query-test', () => {
  const querySplitter = /[\s,]+/;

  function splitQuery(query) {
    return query.split(querySplitter);
  }

  function buildQuery(root) {
    root.add('shop', (shop) => {
      shop.add('name');
    });
  }

  test('constructor takes a typeBundle and a callback which is called with the query\'s SelectionSet', () => {
    let rootType = null;
    const query = new Query(typeBundle, (root) => {
      rootType = root.typeSchema;
      buildQuery(root);
    });

    assert.deepEqual(typeBundle.types.QueryRoot, rootType);
    assert.deepEqual(splitQuery(query.toString()), splitQuery('query { shop { name } }'));
  });

  test('constructor takes a typeBundle, a name, and a callback rendering a named query', () => {
    let rootType = null;
    const query = new Query(typeBundle, 'myQuery', (root) => {
      rootType = root.typeSchema;
      buildQuery(root);
    });

    assert.deepEqual(typeBundle.types.QueryRoot, rootType);
    assert.deepEqual(splitQuery(query.toString()), splitQuery('query myQuery { shop { name } }'));
  });

  test('it identifies anonymous queries', () => {
    const query = new Query(typeBundle, buildQuery);

    assert.equal(query.isAnonymous, true);
  });

  test('it identifies named queries as not anonymous', () => {
    const query = new Query(typeBundle, 'myQuery', buildQuery);

    assert.equal(query.isAnonymous, false);
  });

  test('queries are deeply frozen once they\'ve been built', () => {
    const query = new Query(typeBundle, 'foo', [variable('productId', 'ID!')], buildQuery);

    assertDeeplyFrozen(query);
  });

  test('constructor copies variable definition list into new array', () => {
    const variables = [variable('productId', 'ID!')];
    const query = new Query(typeBundle, 'foo', variables, buildQuery);

    variables.push(variable('foo', 'String'));
    assert.deepEqual(variables, [variable('productId', 'ID!'), variable('foo', 'String')]);
    assert.deepEqual(query.variableDefinitions.variableDefinitions, [variable('productId', 'ID!')]);
  });
});
