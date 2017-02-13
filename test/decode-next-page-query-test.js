import assert from 'assert';
import decode from '../src/decode';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';

suite('decode-next-page-query-test', () => {
  const collectionId = 'gid://shopify/Collection/67890';
  const collectionCursor = 'collection-cursor';
  const productId = 'gid://shopify/Product/72727';
  const variantsCursor = 'variants-cursor';
  const fixture = {
    data: {
      shop: {
        name: 'my-shop',
        collections: {
          pageInfo: {
            hasNextPage: true
          },
          edges: [{
            cursor: collectionCursor,
            node: {
              id: collectionId,
              handle: 'fancy-poles'
            }
          }]
        },
        products: {
          pageInfo: {
            hasNextPage: true
          },
          edges: [{
            cursor: 'product-cursor',
            node: {
              id: productId,
              handle: 'some-product',
              variants: {
                pageInfo: {
                  hasNextPage: true
                },
                edges: [{
                  cursor: variantsCursor,
                  node: {
                    id: 'gid://shopify/ProductVariant/72727',
                    title: 'large'
                  }
                }]
              }
            }
          }]
        }
      }
    }
  };

  let decoded;
  let query;

  const querySplitter = /[\s,]+/;

  function tokens(queryString) {
    return queryString.split(querySplitter).filter((token) => Boolean(token));
  }

  setup(() => {
    query = new Query(typeBundle, (root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
        shop.addConnection('collections', {args: {first: 1}}, (collections) => {
          collections.addField('handle');
        });
        shop.addConnection('products', {args: {first: 1}}, (products) => {
          products.addField('handle');
          products.addConnection('variants', {args: {first: 1}}, (variants) => {
            variants.addField('title');
          });
        });
      });
    });

    decoded = decode(query, fixture.data);
  });

  test('Arrays of Nodes can generate a query to fetch the next page', () => {
    const [nextPageQuery, path] = decoded.shop.collections[0].nextPageQuery();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query {
      shop {
        collections (first: 1, after: "${collectionCursor}") {
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

    assert.deepEqual(path, ['shop', 'collections']);
  });

  test('Arrays of Nodes nested under a truncated query to fetch their next page', () => {
    const [nextPageQuery, path] = decoded.shop.products[0].variants[0].nextPageQuery();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query {
      node (id: "${productId}") {
        __typename
        ... on Product {
          id
          variants (first: 1, after: "${variantsCursor}") {
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
      }
    }`));

    assert.deepEqual(path, ['node', 'variants']);
  });

  test('it can generate a query off of a node with intermediate objects', () => {
    const nestedObjectsQuery = new Query(typeBundle, (root) => {
      root.addField('arbitraryViewer', (viewer) => {
        viewer.addField('aNode', (node) => {
          node.addField('hostObject', {alias: 'hostObjectAlias'}, (host) => {
            host.addField('anotherHost', (anotherHost) => {
              anotherHost.addConnection('products', {alias: 'productsAlias', args: {first: 1}}, (products) => {
                products.addField('handle');
              });
            });
          });
        });
      });
    });
    const productCursor = 'product-cursor';
    const nestedObjectFixture = {
      data: {
        arbitraryViewer: {
          aNode: {
            id: 'gid://shopify/ArbitraryNode/12345',
            hostObjectAlias: {
              anotherHost: {
                productsAlias: {
                  edges: [{
                    cursor: productCursor,
                    node: {
                      id: productId,
                      handle: 'some-product'
                    }
                  }]
                }
              }
            }
          }
        }
      }
    };

    const decodedComplexChain = decode(nestedObjectsQuery, nestedObjectFixture.data);

    const [nextPageQuery, path] = decodedComplexChain.arbitraryViewer.aNode.hostObjectAlias.anotherHost.productsAlias[0].nextPageQuery();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query {
      node (id: "gid://shopify/ArbitraryNode/12345") {
        __typename
        ... on ArbitraryNode {
          id
          hostObjectAlias: hostObject {
            anotherHost {
              productsAlias: products (first: 1, after: "${productCursor}") {
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
          }
        }
      }
    }`));

    assert.deepEqual(path, ['node', 'hostObjectAlias', 'anotherHost', 'productsAlias']);
  });
});
