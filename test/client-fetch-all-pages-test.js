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

    return mockClient.fetchAllPages(models, 1).then(() => {
      assert.equal(models.length, 3);
      assert.equal(models[2].hasNextPage, false, 'last model has no more pages');
      assert.ok(models.slice(0, 2).every((model) => {
        return model.hasNextPage;
      }), 'models before the last model have next pages');
    });
  });

  test('it returns undefined if there is nothing to paginate on', () => {
    assert.equal(typeof mockClient.fetchAllPages([]), 'undefined');
    assert.equal(typeof mockClient.fetchAllPages([{hasNextPage: false}]), 'undefined');
  });
});

