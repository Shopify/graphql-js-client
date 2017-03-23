import assert from 'assert';
import typeBundle from '../fixtures/types';
import Client from '../src/client';

suite('client-fetch-all-pages-test', () => {
  const mockClient = new Client(typeBundle, {url: 'https://sendmecats.myshopify.com/api/graphql'});

  mockClient.count = 0;
  mockClient.fetchNextPage = function() {
    ++this.count;

    return new Promise((resolve) => {
      const model = {
        model: [
          {
            hasNextPage: !(this.count === 2)
          }
        ]
      };

      resolve(model);
    });
  };

  test('it fetches until hasNextPage is false', () => {
    const models = [{hasNextPage: true}];

    return mockClient.fetchAllPages(models, {pageSize: 1}).then((result) => {
      assert.equal(result.length, 3);
      assert.equal(result[2].hasNextPage, false, 'last model has no more pages');
      assert.ok(result.slice(0, 2).every((model) => {
        return model.hasNextPage;
      }), 'models before the last model have next pages');
    });
  });

  test('it returns an empty array if there is nothing to paginate on', () => {
    return mockClient.fetchAllPages([], {pageSize: 1}).then((result) => {
      assert.deepEqual(result, []);
    });
  });

  test('it returns the original array if it already has all pages', () => {
    return mockClient.fetchAllPages([{hasNextPage: true}, {hasNextPage: false}], {pageSize: 1}).then((result) => {
      assert.deepEqual(result, [{hasNextPage: true}, {hasNextPage: false}]);
    });
  });
});
