import assert from 'assert';
import deserializeObject from '../src/deserialize-object';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';


suite('Integration | Node based query generation', () => {
  const collectionId = 'gid://shopify/Collection/67890';
  const collectionCursor = 'collection-cursor';
  const productId = 'gid://shopify/Product/72727';
  const variantsCursor = 'variants-cursor';
  const graphFixture = {
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

  let graph;
  let baseQuery;

  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  setup(() => {
    baseQuery = new Query(typeBundle, (root) => {
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

    // eslint-disable-next-line no-undefined
    graph = deserializeObject(graphFixture.data, baseQuery.selectionSet);
  });

  test('Nodes can generate a query to refetch themselves', () => {
    const refetchQuery = graph.shop.collections[0].refetchQuery();

    assert.deepEqual(tokens(refetchQuery.toString()), tokens(`query {
      node (id: "${collectionId}") {
        ... on Collection {
          id
          handle
        }
      }
    }`));
  });

  test('Arrays of Nodes can generate a query to fetch the next page', () => {
    const nextPageQuery = graph.shop.collections.nextPageQuery();

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
  });

  test('Arrays of Nodes nested under a truncated query to fetch their next page', () => {
    const nextPageQuery = graph.shop.products[0].variants.nextPageQuery();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query {
      node (id: "${productId}") {
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
    const data = {
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
    };

    const nestedGraph = deserializeObject(data, nestedObjectsQuery.selectionSet);

    const nextPageQuery = nestedGraph.arbitraryViewer.aNode.hostObjectAlias.anotherHost.productsAlias.nextPageQuery();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query {
      node (id: "gid://shopify/ArbitraryNode/12345") {
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
  });
});
