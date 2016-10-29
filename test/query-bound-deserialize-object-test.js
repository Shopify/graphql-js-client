import assert from 'assert';
import deserializeObject from '../src/deserialize-object';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';

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
            id: 'gid://shopify/Product/12345',
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

const baseQuery = new Query(typeBundle, (root) => {
  boundRoot = root;
  root.addInlineFragmentOn('Node', (node) => {
    node.addField('id');
  });
  root.addField('shop', (shop) => {
    boundShop = shop;
    shop.addConnection('products', {first: 1}, (products) => {
      boundProducts = products;
      products.addField('handle');
      products.addConnection('images', {first: 1}, (images) => {
        boundImages = images;
        images.addField('src');
      });
    });
  });
});

suite('Integration | Query bound object graph', () => {
  test('it binds query nodes', () => {
    // eslint-disable-next-line no-undefined
    const graph = deserializeObject(typeBundle, graphFixture.data, 'QueryRoot', undefined, baseQuery.selectionSet);

    assert.equal(graph.queryNode, boundRoot);
    assert.equal(graph.shop.queryNode, boundShop);
    assert.equal(graph.shop.products[0].queryNode, boundProducts);
    assert.equal(graph.shop.products[0].images[0].queryNode, boundImages);
  });
});
