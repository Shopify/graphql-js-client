import assert from 'assert';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Client from '../src/client';
import Document from '../src/document';
import Query from '../src/query';
import Mutation from '../src/mutation';
import ClassRegistry from '../src/class-registry';
import GraphModel from '../src/graph-model';
import variable from '../src/variable';

suite('client-test', () => {
  test('it has a type bundle', () => {
    const client = new Client(typeBundle, {url: '/graphql'});

    assert.deepEqual(client.typeBundle, typeBundle);
  });

  test('it builds a client with url and fetcherOptions', () => {
    const client = new Client(typeBundle, {url: '/graphql', fetcherOptions: {mode: 'no-cors'}});

    assert.ok(client instanceof Client);
  });

  test('it builds a client with fetcher', () => {
    function fetcher(url) { return url; }

    const client = new Client(typeBundle, {fetcher});

    assert.ok(client instanceof Client);
  });

  test('it throws an error if both url and fetcher are set', () => {
    function fetcher(url) { return url; }

    function createClient() {
      return new Client(typeBundle, {url: '/graphql', fetcher});
    }

    assert.throws(createClient, Error);
  });

  test('it throws an error if neither url or fetcher are set', () => {
    function createClient() {
      return new Client(typeBundle);
    }

    assert.throws(createClient, Error);
  });

  test('it throws an error if fetcher and fetcherOptions are set', () => {
    function fetcher(url) { return url; }

    function createClient() {
      return new Client(typeBundle, {fetcher, fetcherOptions: {}});
    }

    assert.throws(createClient, Error);
  });

  test('it builds documents', () => {
    const client = new Client(typeBundle, {url: '/graphql'});
    const clientDocument = client.document();
    const expectedDocument = new Document(typeBundle);

    assert.deepEqual(clientDocument, expectedDocument);
  });

  test('it builds queries', () => {
    const client = new Client(typeBundle, {url: '/graphql'});
    const clientQuery = client.query('myQuery', (root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
      });
    });
    const expectedQuery = new Query(typeBundle, 'myQuery', (root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
      });
    });

    assert.deepEqual(clientQuery, expectedQuery);
  });

  test('it builds mutations', () => {
    const client = new Client(typeBundle, {url: '/graphql'});
    const input = variable('input', 'ApiCustomerAccessTokenCreateInput!');
    const clientMutation = client.mutation('myMutation', [input], (root) => {
      root.addField('apiCustomerAccessTokenCreate', {args: {input}}, (apiCustomerAccessTokenCreate) => {
        apiCustomerAccessTokenCreate.addField('apiCustomerAccessToken', (apiCustomerAccessToken) => {
          apiCustomerAccessToken.addField('accessToken');
        });
      });
    });

    const expectedMutation = new Mutation(typeBundle, 'myMutation', [input], (root) => {
      root.add('apiCustomerAccessTokenCreate', {args: {input}}, (apiCustomerAccessTokenCreate) => {
        apiCustomerAccessTokenCreate.add('apiCustomerAccessToken', (apiCustomerAccessToken) => {
          apiCustomerAccessToken.add('accessToken');
        });
      });
    });

    assert.deepEqual(clientMutation, expectedMutation);
  });

  test('it sends queries', () => {
    let fetcherGraphQLParams = null;
    let fetcherURL = null;

    function mockFetcher(url) {
      fetcherURL = url;

      return function fetcher(graphQLParams) {
        fetcherGraphQLParams = graphQLParams;

        return Promise.resolve({data: {shop: {name: 'Snowdevil'}}});
      };
    }

    const fetcher = mockFetcher('https://graphql.example.com');
    const mockClient = new Client(typeBundle, {fetcher});

    const query = mockClient.query((root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
      });
    });

    return mockClient.send(query).then((response) => {
      assert.equal(fetcherURL, 'https://graphql.example.com');
      assert.deepEqual(fetcherGraphQLParams, {query: query.toString()});
      assert.deepEqual(response.data, {shop: {name: 'Snowdevil'}});
      assert.equal(response.model.shop.name, 'Snowdevil');
      assert.ok(response.model instanceof GraphModel);
    });
  });

  test('it decodes responses with ClassRegistry', () => {
    class ShopModel extends GraphModel {}

    const classRegistry = new ClassRegistry();

    classRegistry.registerClassForType(ShopModel, 'Shop');

    const mockingClient = new Client(typeBundle, {fetcher: () => {
      return Promise.resolve({data: {shop: {name: 'Snowdevil'}}});
    }, registry: classRegistry});

    const query = mockingClient.query((root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
      });
    });

    return mockingClient.send(query).then((response) => {
      assert.ok(response.model instanceof GraphModel);
      assert.ok(response.model.shop instanceof ShopModel);
    });
  });

  test('it sends documents', () => {
    let fetcherGraphQLParams = null;
    let fetcherURL = null;

    function mockFetcher(url) {
      fetcherURL = url;

      return function fetcher(graphQLParams) {
        fetcherGraphQLParams = graphQLParams;

        return Promise.resolve({data: {shop: {name: 'Snowdevil'}}});
      };
    }

    const fetcher = mockFetcher('https://graphql.example.com');
    const mockClient = new Client(typeBundle, {fetcher});

    const document = mockClient.document();

    document.addQuery((root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
      });
    });

    return mockClient.send(document).then((response) => {
      assert.equal(fetcherURL, 'https://graphql.example.com');
      assert.deepEqual(fetcherGraphQLParams, {query: document.toString()});
      assert.deepEqual(response.data, {shop: {name: 'Snowdevil'}});
      assert.equal(response.model.shop.name, 'Snowdevil');
      assert.ok(response.model instanceof GraphModel);
    });
  });

  test('it sends mutations', () => {
    let fetcherGraphQLParams = null;
    let fetcherURL = null;

    function mockFetcher(url) {
      fetcherURL = url;

      return function fetcher(graphQLParams) {
        fetcherGraphQLParams = graphQLParams;

        return Promise.resolve({
          data: {
            apiCustomerAccessTokenCreate: {
              apiCustomerAccessToken: {
                id: 'gid://shopify/ApiCustomerAccessToken/1',
                accessToken: '7bfefea8142a7ec40f694dc8336a8ddb'
              }
            }
          }
        });
      };
    }

    const fetcher = mockFetcher('https://graphql.example.com');
    const mockClient = new Client(typeBundle, {fetcher});

    const input = variable('input', 'ApiCustomerAccessTokenCreateInput!');
    const mutation = mockClient.mutation([input], (root) => {
      root.addField('apiCustomerAccessTokenCreate', {args: {input}}, (apiCustomerAccessTokenCreate) => {
        apiCustomerAccessTokenCreate.addField('apiCustomerAccessToken', (apiCustomerAccessToken) => {
          apiCustomerAccessToken.addField('accessToken');
        });
      });
    });

    return mockClient.send(mutation).then((response) => {
      assert.equal(fetcherURL, 'https://graphql.example.com');
      assert.deepEqual(fetcherGraphQLParams, {query: mutation.toString()});
      assert.deepEqual(response.data, {apiCustomerAccessTokenCreate: {apiCustomerAccessToken: {id: 'gid://shopify/ApiCustomerAccessToken/1', accessToken: '7bfefea8142a7ec40f694dc8336a8ddb'}}});
      assert.equal(response.model.apiCustomerAccessTokenCreate.apiCustomerAccessToken.accessToken, '7bfefea8142a7ec40f694dc8336a8ddb');
      assert.ok(response.model instanceof GraphModel);
    });
  });
});
