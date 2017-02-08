import assert from 'assert';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Client from '../src/client';

suite('client-document-fragment-integration-test', () => {
  test('it can create a document, with a fragment, and decode the result', () => {
    let fetcherGraphQLParams = null;

    function mockFetcher() {
      return function fetcher(graphQLParams) {
        fetcherGraphQLParams = graphQLParams;

        return Promise.resolve({data: {shop: {name: 'Snowdevil'}}});
      };
    }

    const fetcher = mockFetcher('https://graphql.example.com');
    const mockClient = new Client(typeBundle, {fetcher});

    const document = mockClient.document();

    const fragment = document.addFragment('fancyFragment', 'Shop', (shop) => {
      shop.add('name');
    });

    document.addQuery((root) => {
      root.add('shop', (shop) => {
        shop.add(fragment);
      });
    });

    return mockClient.send(document).then((response) => {
      assert.deepEqual(fetcherGraphQLParams, {query: document.toString()});
      assert.deepEqual(response.data, {shop: {name: 'Snowdevil'}});
      assert.equal(response.model.shop.name, 'Snowdevil');
    });
  });
});
