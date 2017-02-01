import assert from 'assert';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('adds-__typename-to-interface-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  test('it adds __typename to interfaces', () => {
    const id = 'gid://shopify/Product/12345';
    const query = new Query(typeBundle, (root) => {
      root.add('node', {args: {id}}, (node) => {
        node.add('id');
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query {
      node (id: "${id}") {
        __typename
        id
      }
    }`));
  });
});
