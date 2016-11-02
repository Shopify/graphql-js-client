import assert from 'assert';
import deserializeObject from '../src/deserialize-object';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';


suite('Integration | Ancestral Nodes', () => {
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
  let collectionsSelectionSet;
  let productsSelectionSet;

  setup(() => {
    baseQuery = new Query(typeBundle, (root) => {
      root.addInlineFragmentOn('Node', (node) => {
        node.addField('id');
      });
      root.addField('shop', (shop) => {
        shop.addConnection('collections', {first: 1}, (collections) => {
          collectionsSelectionSet = collections;
          collections.addField('handle');
          collections.addConnection('products', {first: 1}, (products) => {
            productsSelectionSet = products;
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

  test('it identifies objects that are nodes', () => {
    assert.equal(graph.ancestry.isNode, false, 'the root is not a node');
    assert.equal(graph.shop.ancestry.isNode, false, 'shop is not a node');
    assert.equal(graph.shop.collections[0].ancestry.isNode, true, 'collections are nodes');
    assert.equal(graph.shop.collections[0].products[0].ancestry.isNode, true, 'products are nodes');
    assert.equal(graph.shop.collections[0].products[0].images[0].ancestry.isNode, false, 'images are not nodes');
  });

  test('it identifies the nearest parent Node', () => {
    assert.equal(graph.ancestry.nearestNode, null, 'query root has no nearest parent Node');
    assert.equal(graph.shop.ancestry.nearestNode, null, 'shop has no nearest parent Node');
    assert.equal(graph.shop.collections[0].ancestry.nearestNode, null, 'collections have no nearest parent node');
    assert.deepEqual(graph.shop.collections[0].products[0].ancestry.nearestNode, {
      id: collectionId,
      selectionSet: collectionsSelectionSet
    }, 'product has a nearest node of the parent collection');
    assert.deepEqual(graph.shop.collections[0].products[0].images[0].ancestry.nearestNode, {
      id: productId,
      selectionSet: productsSelectionSet
    }, 'image has a nearest node of the parent product');
  });
});

