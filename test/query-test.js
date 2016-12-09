import assert from 'assert';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

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
});
