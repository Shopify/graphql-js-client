import assert from 'assert';
import decode from '../src/decode';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('decode-inline-fragment-test', () => {

  const id = 'gid://shopify/Product/12345';
  const handle = 'toilet-brush';
  const data = {
    node: {
      id,
      handle: 'toilet-brush',
      __typename: 'Product'
    }
  };

  const query = new Query(typeBundle, (root) => {
    root.add('node', {args: {id}}, (node) => {
      node.addInlineFragmentOn('Product', (product) => {
        product.add('handle');
      });
    });
  });

  test('it can decode data from a query with inline fragments', () => {
    const decoded = decode(query, data);

    assert.equal(decoded.node.id, id);
    assert.equal(decoded.node.handle, handle);
  });

  test('it can apply type information to interfaces containing typed fragments', () => {
    const decoded = decode(query, data);

    assert.equal(decoded.node.type.name, 'Product');
  });

  test('it can recursively decode inline fragments', () => {
    const queryWithNestedFragments = new Query(typeBundle, (root) => {
      root.add('node', {args: {id}}, (node) => {
        node.addInlineFragmentOn('Product', (product) => {
          product.add('id');
          product.addInlineFragmentOn('Product', (product2) => {
            product2.add('handle');
          });
        });
      });
    });

    const decoded = decode(queryWithNestedFragments, data);

    assert.equal(decoded.node.type.name, 'Product');
  });
});
