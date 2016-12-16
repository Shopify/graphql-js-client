import assert from 'assert';
import deserializeObject from '../src/deserialize-object';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';


suite('Integration | Query bound object graph', () => {
  const productId = 'gid://shopify/Product/12345';
  const graphFixture = {
    data: {
      shop: {
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
    }
  };

  let boundRoot;
  let boundShop;
  let boundProducts;
  let boundImages;
  let baseQuery;
  let graph;

  setup(() => {
    baseQuery = new Query(typeBundle, (root) => {
      boundRoot = root;
      root.addField('shop', (shop) => {
        boundShop = shop;
        shop.addConnection('products', {args: {first: 1}}, (products) => {
          boundProducts = products;
          products.addField('id');
          products.addField('handle');
          products.addConnection('images', {args: {first: 1}}, (images) => {
            boundImages = images;
            images.addField('id');
            images.addField('src');
          });
        });
      });
    });

    // eslint-disable-next-line no-undefined
    graph = deserializeObject(graphFixture.data, baseQuery.selectionSet);
  });

  test('it binds selections through ancestry', () => {
    assert.deepEqual(graph.ancestry.selectionSet.selections, boundRoot.selections);
    assert.deepEqual(graph.shop.ancestry.selectionSet.selections, boundShop.selections);
    assert.deepEqual(graph.shop.products[0].ancestry.selectionSet.selections, boundProducts.selections);
    assert.deepEqual(graph.shop.products[0].images[0].ancestry.selectionSet.selections, boundImages.selections);
  });
});
