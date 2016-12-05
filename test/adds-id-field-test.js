import assert from 'assert';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('adds-id-field-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  test('it adds ID fields to nodes', () => {
    const relayQuery = new Query(typeBundle, (root) => {
      root.add('product', {id: 'gid://shopify/Product/12345'}, (product) => {
        product.add('handle');
      });
    });

    assert.deepEqual(tokens(relayQuery.toString()), tokens(`query {
      product (id: "gid://shopify/Product/12345") {
        id
        handle
      }
    }`));
  });

  test('it doesn\'t complain or duplicate if you manually add IDs', () => {
    const relayQuery = new Query(typeBundle, (root) => {
      root.add('product', {id: 'gid://shopify/Product/12345'}, (product) => {
        product.add('id');
        product.add('handle');
      });
    });

    assert.deepEqual(tokens(relayQuery.toString()), tokens(`query {
      product (id: "gid://shopify/Product/12345") {
        id
        handle
      }
    }`));
  });

  test('it adds IDs to nodes in connections', () => {
    const relayQuery = new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('products', (products) => {
          products.add('handle');
        });
      });
    });

    assert.deepEqual(tokens(relayQuery.toString()), tokens(`query {
      shop {
        products {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              id
              handle
            }
          }
        }
      }
    }`));
  });

  test('it doesn\'t complain or duplicate if you manually add ID in to a node in a connection', () => {
    const relayQuery = new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('products', (products) => {
          products.add('id');
          products.add('handle');
        });
      });
    });

    assert.deepEqual(tokens(relayQuery.toString()), tokens(`query {
      shop {
        products {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              id
              handle
            }
          }
        }
      }
    }`));
  });

  test('it adds the ID field to the interface "Node"', () => {
    const relayQuery = new Query(typeBundle, (root) => {
      root.add('node', {id: 'gid://shopify/Product/12345'});
    });

    assert.deepEqual(tokens(relayQuery.toString()), tokens(`query {
      node (id: "gid://shopify/Product/12345") {
        id
      }
    }`));
  });

  test('it doesn\'t duplicate the ID field if it exists in an inline fragment on "node"', () => {
    const relayQuery = new Query(typeBundle, (root) => {
      root.add('node', {id: 'gid://shopify/Product/12345'}, (node) => {
        node.addInlineFragmentOn('Product', (product) => {
          product.add('id');
          product.add('handle');
        });
      });
    });

    assert.deepEqual(tokens(relayQuery.toString()), tokens(`query {
      node (id: "gid://shopify/Product/12345") {
        ... on Product {
          id
          handle
        }
      }
    }`));
  });

  test('it doesn\'t duplicate the ID field if it exists in an inline fragment on a resource that implements node', () => {
    const relayQuery = new Query(typeBundle, (root) => {
      root.add('product', {id: 'gid://shopify/Product/12345'}, (product) => {
        product.add('handle');
        product.addInlineFragmentOn('Product', (productFragment) => {
          productFragment.add('id');
        });
      });
    });

    assert.deepEqual(tokens(relayQuery.toString()), tokens(`query {
      product (id: "gid://shopify/Product/12345") {
        handle
        ... on Product {
          id
        }
      }
    }`));
  });

  test('it doesn\'t duplicate the ID field if it exists in a nested inline fragment', () => {
    const relayQuery = new Query(typeBundle, (root) => {
      root.add('node', {id: 'gid://shopify/Product/12345'}, (node) => {
        node.addInlineFragmentOn('Product', (product) => {
          product.add('handle');
          product.addInlineFragmentOn('Product', (nestedFragment) => {
            nestedFragment.add('id');
          });
        });
      });
    });

    assert.deepEqual(tokens(relayQuery.toString()), tokens(`query {
      node (id: "gid://shopify/Product/12345") {
        ... on Product {
          handle
          ... on Product {
            id
          }
        }
      }
    }`));
  });
});
