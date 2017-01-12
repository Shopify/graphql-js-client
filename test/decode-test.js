import assert from 'assert';
import ClassRegistry from '../src/class-registry';
import decode from '../src/decode';
import GraphModel from '../src/graph-model';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

const graphFixture = {
  data: {
    shop: {
      name: 'buckets-o-stuff',
      products: {
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false
        },
        edges: [
          {
            cursor: 'eyJsYXN0X2lkIjozNjc3MTg5ODg5LCJsYXN0X3ZhbHVlIjoiMzY3NzE4OTg4OSJ9',
            node: {
              handle: 'aluminum-pole'
            }
          },
          {
            cursor: 'eyJsYXN0X2lkIjozNjgwODg2NzIxLCJsYXN0X3ZhbHVlIjoiMzY4MDg4NjcyMSJ9',
            node: {
              handle: 'electricity-socket-with-jam'
            }
          },
          {
            cursor: 'eyJsYXN0X2lkIjo0MTQwMTI3MDQxLCJsYXN0X3ZhbHVlIjoiNDE0MDEyNzA0MSJ9',
            node: {
              handle: 'borktown'
            }
          }
        ]
      }
    }
  }
};

const graphQuery = new Query(typeBundle, (root) => {
  root.addField('shop', (shop) => {
    shop.addField('name');
    shop.addConnection('products', (products) => {
      products.addField('handle');
    });
  });
});

const productId = 'gid://shopify/Product/3677189889';
const productFixture = {
  data: {
    product: {
      id: productId,
      handle: 'aluminum-pole',
      options: [
        {
          name: 'Color'
        },
        {
          name: 'Size'
        }
      ],
      imagesAlias: {
        edges: [
          {
            node: {
              src: 'https://cdn.shopify.com/s/files/1/1090/1932/products/festivus-pole-the-strike-seinfeld.jpg?v=1449866700'
            }
          },
          {
            node: {
              src: 'https://cdn.shopify.com/s/files/1/1090/1932/products/giphy.gif?v=1450204755'
            }
          }
        ]
      }
    }
  }
};

const productQuery = new Query(typeBundle, (root) => {
  root.addField('product', {args: {id: productId}}, (product) => {
    product.addField('id');
    product.addField('handle');
    product.addField('options', (options) => {
      options.addField('name');
    });
    product.addConnection('images', {alias: 'imagesAlias'}, (images) => {
      images.addField('src');
    });
  });
});


suite('decode-test', () => {
  test('it decodes a very simple query response', () => {
    const query = new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.add('name');
      });
    });
    const data = {shop: {name: 'foo'}};
    const decoded = decode(query, data);

    assert.deepEqual(decoded, new GraphModel({
      shop: new GraphModel({
        name: 'foo'
      })
    }));
  });

  test('it creates a GraphModel from the root type', () => {
    const graph = decode(graphQuery, graphFixture.data);

    assert.ok(GraphModel.prototype.isPrototypeOf(graph), 'root type is a graph model');
  });

  test('it instantiates a model with relationship fields', () => {
    const graph = decode(graphQuery, graphFixture.data);

    assert.ok(GraphModel.prototype.isPrototypeOf(graph.shop), 'shop relationship is a graph model');
    assert.equal(graph.shop.attrs.name, 'buckets-o-stuff', 'shop model contains scalar attrs');
    assert.deepEqual(
      graph.shop.attrs.products.map((product) => product.attrs).map((attrs) => attrs.handle),
      [
        'aluminum-pole',
        'electricity-socket-with-jam',
        'borktown'
      ],
      'shop model contains connection attrs'
    );
  });

  test('it creates an array from lists of paginated relationships', () => {
    const graph = decode(graphQuery, graphFixture.data);

    assert.ok(Array.isArray(graph.shop.products), 'shops products are in an array');
    assert.equal(graph.shop.products.length, 3, 'there are three products');
  });

  test('it instantiates paginated list members as models', () => {
    const graph = decode(graphQuery, graphFixture.data);

    graphFixture.data.shop.products.edges.forEach((product, index) => {
      assert.ok(GraphModel.prototype.isPrototypeOf(graph.shop.products[index]), 'products are graph models');
      assert.equal(graph.shop.products[index].attrs.handle, product.node.handle, 'products contain payload attrs');
    });
  });

  test('it creates an array from lists of non-paginated relationships', () => {
    const graph = decode(productQuery, productFixture.data);

    assert.ok(Array.isArray(graph.product.options), 'products images are in an array');
    assert.equal(graph.product.options.length, 2, 'there are two options');
  });

  test('it instantiates basic list members as models', () => {
    const graph = decode(productQuery, productFixture.data);

    assert.ok(GraphModel.prototype.isPrototypeOf(graph.product.options[0]));
    assert.equal(graph.product.options[0].name, productFixture.data.product.options[0].name);
  });

  test('it instantiates types with their registered models', () => {
    const registry = new ClassRegistry();

    class ShopModel extends GraphModel { }

    class ProductModel extends GraphModel { }

    registry.registerClassForType(ShopModel, 'Shop');
    registry.registerClassForType(ProductModel, 'Product');

    const graph = decode(graphQuery, graphFixture.data, {classRegistry: registry});

    assert.ok(ShopModel.prototype.isPrototypeOf(graph.shop), 'shop node is a shop model');
    assert.ok(ProductModel.prototype.isPrototypeOf(graph.shop.products[0]), 'product node is a product model');
  });
});
