import assert from 'assert';
import deserializeObject from '../src/deserialize-object';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';


suite('Integration | Node based query generation', () => {
  const productId = 'gid://shopify/Product/12345';
  const collectionId = 'gid://shopify/Collection/67890';
  const graphFixture = {
    data: {
      shop: {
        collections: {
          pageInfo: {
            hasNextPage: true
          },
          edges: [{
            cursor: 'product-cursor',
            node: {
              id: collectionId,
              handle: 'fancy-poles',
              products: {
                pageInfo: {
                  hasNextPage: true
                },
                edges: [{
                  cursor: 'product-cursor',
                  node: {
                    id: productId,
                    handle: 'aluminum-pole',
                    images: {
                      pageInfo: {
                        hasNextPage: true
                      },
                      edges: [{
                        cursor: 'images-cursor',
                        node: {
                          id: 'gid://shopify/Image/12346',
                          src: 'https://cdn.shopify.com/s/files/1/1090/1932/products/giphy.gif?v=1450204755'
                        }
                      }]
                    }
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
      root.addInlineFragmentOn('Node', (node) => {
        node.addField('id');
      });
      root.addField('shop', (shop) => {
        shop.addConnection('collections', {first: 1}, (collections) => {
          collections.addField('handle');
          collections.addConnection('products', {first: 1}, (products) => {
            products.addField('handle');
            products.addConnection('images', {first: 1}, (images) => {
              images.addField('src');
            });
          });
        });
      });
    });

    // eslint-disable-next-line no-undefined
    graph = deserializeObject(typeBundle, graphFixture.data, 'QueryRoot', undefined, baseQuery.selectionSet);
  });

  test('Nodes can generate a query to refetch themselves', () => {
    const refetchQuery = graph.shop.collections[0].products[0].refetchQuery();

    assert.deepEqual(tokens(refetchQuery.toString()), tokens(`query {
      ... on Node {
        id
      }
      node (id: "${productId}") {
        ... on Product {
          handle
          images (first: 1) {
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              cursor
              node {
                src
              }
            }
          }
        }
      }
    }`));
  });
});
