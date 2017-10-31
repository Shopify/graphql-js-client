import assert from 'assert';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Client from '../src/client';
import Query from '../src/query';
import decode from '../src/decode';

suite('client-fetch-next-page-test', () => {
  const query = new Query(typeBundle, (root) => {
    root.add('shop', (shop) => {
      shop.addConnection('collections', {args: {first: 1}}, (collection) => {
        collection.addConnection('products', {args: {first: 1}}, (product) => {
          product.add('handle');
        });
      });
    });
  });

  const pageOneData = {
    shop: {
      collections: {
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false
        },
        edges: [{
          cursor: 'collection-cursor',
          node: {
            id: 'collection-id',
            products: {
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false
              },
              edges: [{
                cursor: 'product-cursor-one',
                node: {
                  handle: 'a-literal-taco'
                }
              }]
            }
          }
        }]
      }
    }
  };

  const pageTwoData = {
    node: {
      id: 'collection-id',
      products: {
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true
        },
        edges: [{
          cursor: 'product-cursor-two',
          node: {
            handle: 'a-different-literal-taco'
          }
        }]
      }
    }
  };

  const pageTwoMultipleData = {
    node: {
      id: 'collection-id',
      products: {
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true
        },
        edges: [{
          cursor: 'product-cursor-two',
          node: {
            handle: 'a-different-literal-taco'
          }
        }, {
          cursor: 'product-cursor-three',
          node: {
            handle: 'an-even-more-different-literal-taco'
          }
        }]
      }
    }
  };


  let fetcherGraphQLParams;
  let decoded;

  function mockFetcher() {
    return function fetcher(graphQLParams) {
      fetcherGraphQLParams = graphQLParams;

      return Promise.resolve({data: pageTwoData});
    };
  }

  function mockFetcherMultiple() {
    return function fetcher(graphQLParams) {
      fetcherGraphQLParams = graphQLParams;

      return Promise.resolve({data: pageTwoMultipleData});
    };
  }

  setup(() => {
    decoded = decode(query, pageOneData);
  });

  teardown(() => {
    fetcherGraphQLParams = null;
  });

  test('it fetches next page from the last element in the passed list sets the response model to the next set', () => {
    const fetcher = mockFetcher();
    const mockClient = new Client(typeBundle, {fetcher});

    return mockClient.fetchNextPage(decoded.shop.collections[0].products).then((response) => {
      assert.deepEqual(fetcherGraphQLParams, {query: decoded.shop.collections[0].products[0].nextPageQueryAndPath()[0].toString()});
      assert.ok(Array.isArray(response.model), 'model is array');
      assert.equal(response.model[0].type.name, 'Product', 'array members are Products');
      assert.equal(response.model[0].handle, 'a-different-literal-taco', 'model info gets passed through');
    });
  });

  test('it fetches next page from the passed list element and sets the response model to the next set', () => {
    const fetcher = mockFetcher();
    const mockClient = new Client(typeBundle, {fetcher});

    return mockClient.fetchNextPage(decoded.shop.collections[0].products[0]).then((response) => {
      assert.deepEqual(fetcherGraphQLParams, {query: decoded.shop.collections[0].products[0].nextPageQueryAndPath()[0].toString()});
      assert.ok(Array.isArray(response.model), 'model is array');
      assert.equal(response.model[0].type.name, 'Product', 'array members are Products');
      assert.equal(response.model[0].handle, 'a-different-literal-taco', 'model info gets passed through');
    });
  });

  test('it fetches next page with the number of models specified', () => {
    const fetcher = mockFetcherMultiple();
    const mockClient = new Client(typeBundle, {fetcher});

    return mockClient.fetchNextPage(decoded.shop.collections[0].products, {first: 2}).then((response) => {
      assert.deepEqual(fetcherGraphQLParams, {query: decoded.shop.collections[0].products[0].nextPageQueryAndPath()[0].toString(), variables: {first: 2}});
      assert.ok(Array.isArray(response.model), 'model is array');
      assert.equal(response.model.length, 2, 'two products are returned');
      assert.equal(response.model[0].type.name, 'Product', 'array members are Products');
      assert.equal(response.model[1].type.name, 'Product', 'array members are Products');
      assert.equal(response.model[0].handle, 'a-different-literal-taco', 'model info gets passed through');
      assert.equal(response.model[1].handle, 'an-even-more-different-literal-taco', 'model info gets passed through');
    });
  });

  test('it fetches the next page with persistent variable values', () => {
    const fetcher = mockFetcherMultiple();
    const mockClient = new Client(typeBundle, {fetcher});
    const sortVar = mockClient.variable('sort', 'ProductSortKeys');
    const queryWithAdditionalVars = new Query(typeBundle, [sortVar], (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('collections', {args: {first: 1}}, (collection) => {
          collection.addConnection('products', {args: {first: 1, sortKey: sortVar}}, (product) => {
            product.add('handle');
          });
        });
      });
    });

    const decodedWithAdditionalVars = decode(queryWithAdditionalVars, pageOneData, {variableValues: {sort: 'ID'}});

    return mockClient.fetchNextPage(decodedWithAdditionalVars.shop.collections[0].products, {first: 2}).then(() => {
      assert.equal(fetcherGraphQLParams.query, decodedWithAdditionalVars.shop.collections[0].products[0].nextPageQueryAndPath()[0].toString());
      assert.equal(fetcherGraphQLParams.variables.first, 2);
      assert.equal(fetcherGraphQLParams.variables.sort, 'ID');
    });
  });

  test('it fetches the next page with persistent variable values when no values are specified', () => {
    const fetcher = mockFetcherMultiple();
    const mockClient = new Client(typeBundle, {fetcher});
    const sortVar = mockClient.variable('sort', 'ProductSortKeys');
    const queryWithAdditionalVars = new Query(typeBundle, [sortVar], (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('collections', {args: {first: 1}}, (collection) => {
          collection.addConnection('products', {args: {first: 1, sortKey: sortVar}}, (product) => {
            product.add('handle');
          });
        });
      });
    });

    const decodedWithAdditionalVars = decode(queryWithAdditionalVars, pageOneData, {variableValues: {sort: 'ID'}});

    return mockClient.fetchNextPage(decodedWithAdditionalVars.shop.collections[0].products).then(() => {
      assert.equal(fetcherGraphQLParams.query, decodedWithAdditionalVars.shop.collections[0].products[0].nextPageQueryAndPath()[0].toString());
      assert.equal(fetcherGraphQLParams.variables.sort, 'ID');
    });
  });
});
