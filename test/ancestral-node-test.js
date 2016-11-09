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
                    options: [{
                      name: 'beans'
                    }]
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
            products.addField('options', (options) => {
              options.addField('name');
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
    assert.equal(graph.shop.collections[0].products[0].options[0].ancestry.isNode, false, 'options are not nodes');
  });

  test('it identifies parents in the ancestry chain', () => {
    assert.equal(graph.ancestry.parent, null, 'root node has a null parent');
    assert.equal(graph.shop.ancestry.parent, graph.ancestry, 'shop\'s parent is the root node');
    assert.equal(graph.shop.collections[0].ancestry.parent, graph.shop.ancestry, 'collection\'s parent is the shop');
    assert.equal(graph.shop.collections[0].products[0].ancestry.parent, graph.shop.collections[0].ancestry, 'product\'s parent is the collection');
    assert.equal(graph.shop.collections[0].products[0].options[0].ancestry.parent, graph.shop.collections[0].products[0].ancestry, 'option\'s parent is the product');
  });

  test('it identifies the nearest parent Node', () => {
    assert.equal(graph.ancestry.nearestNode, null, 'query root has no nearest parent Node');
    assert.equal(graph.shop.ancestry.nearestNode, null, 'shop has no nearest parent Node');
    assert.equal(graph.shop.collections[0].ancestry.nearestNode, null, 'collections have no nearest parent node');
    assert.deepEqual(graph.shop.collections[0].products[0].ancestry.nearestNode, graph.shop.collections[0].ancestry, 'product has a nearest node of the parent collection');
    assert.deepEqual(graph.shop.collections[0].products[0].options[0].ancestry.nearestNode, graph.shop.collections[0].products[0].ancestry, 'option has a nearest node of the parent product');
  });
});

