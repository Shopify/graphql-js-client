import assert from 'assert';
import Graph from '../src/graph';

suite('Unit | GraphHelpers | class Graph', () => {
  const querySplitter = /[\s,]+/;

  function splitQuery(query) {
    return query.split(querySplitter);
  }

  test('it builds queries off the root', () => {
    const graph = new Graph();

    assert.deepEqual(splitQuery(graph.toQuery()), splitQuery('query { }'));
  });

  test('it builds queries off the passed type', () => {
    const graph = new Graph('Shop');

    assert.deepEqual(splitQuery(graph.toQuery()), splitQuery('fragment on Shop { }'));
  });

  test('it can add basic fields', () => {
    const graph = new Graph('Shop');

    graph.addField('name');

    assert.deepEqual(splitQuery(graph.toQuery()), splitQuery('fragment on Shop { name }'));
  });

  test('it yields an instance of Graph representing the type passed to addField', () => {
    const graph = new Graph();

    graph.addField('shop', {}, (shop) => {
      assert.ok(Graph.prototype.isPrototypeOf(shop));
    });
  });

  test('it composes nested graphs', () => {
    const graph = new Graph();

    graph.addField('shop', {}, (shop) => {
      shop.addField('name');
    });

    assert.deepEqual(splitQuery(graph.toQuery()), splitQuery('query { shop { name } }'));
  });

  test('it can attach args to nested nodes', () => {
    const graph = new Graph();

    graph.addField('product', {id: '1'}, (shop) => {
      shop.addField('title');
    });

    assert.deepEqual(splitQuery(graph.toQuery()), splitQuery('query { product (id: "1") { title } }'));
  });

  test('it adds connections with pagination info', () => {
    const graph = new Graph();

    graph.addField('shop', {}, (shop) => {
      shop.addField('name');
      shop.addConnection('products', {first: 10}, (product) => {
        product.addField('handle');
      });
    });

    assert.deepEqual(splitQuery(graph.toQuery()), splitQuery(`query {
      shop {
        name,
        products (first: 10) {
          pageInfo {
            hasNextPage,
            hasPreviousPage
          },
          edges {
            cursor,
            node {
              handle
            }
          }
        }
      }
    }`));
  });

});
