import assert from 'assert';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('Unit | Query', () => {
  const querySplitter = /[\s,]+/;

  function splitQuery(query) {
    return query.split(querySplitter);
  }

  test('constructor takes a typeBundle and a callback which is called with the query\'s SelectionSet', () => {
    let rootType = null;
    const query = new Query(typeBundle, (root) => {
      rootType = root.typeSchema;
      root.addField('shop', (shop) => {
        shop.addField('name');
      });
    });

    assert.deepEqual(typeBundle.QueryRoot, rootType);
    assert.deepEqual(splitQuery(query.toString()), splitQuery('query { shop { name } }'));
  });
});
