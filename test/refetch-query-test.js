import assert from 'assert';
import deserializeObject from '../src/deserialize-object';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';


suite('Integration | Node based query generation', () => {
  const collectionId = 'gid://shopify/Collection/67890';
  const collectionCursor = 'collection-cursor';
  const graphFixture = {
    data: {
      shop: {
        collections: {
          pageInfo: {
            hasNextPage: true
          },
          edges: [{
            cursor: collectionCursor,
            node: {
              id: collectionId,
              handle: 'fancy-poles'
            }
          }]
        }
      }
    }
  };

  let graph;
  let baseQuery;

  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  setup(() => {
    baseQuery = new Query(typeBundle, (root) => {
      root.addField('shop', (shop) => {
        shop.addConnection('collections', {first: 1}, (collections) => {
          collections.addField('id');
          collections.addField('handle');
        });
      });
    });

    // eslint-disable-next-line no-undefined
    graph = deserializeObject(graphFixture.data, baseQuery.selectionSet);
  });

  test('Nodes can generate a query to refetch themselves', () => {
    const refetchQuery = graph.shop.collections[0].refetchQuery();

    assert.deepEqual(tokens(refetchQuery.toString()), tokens(`query {
      node (id: "${collectionId}") {
        ... on Collection {
          id
          handle
        }
      }
    }`));
  });

  test('Arrays of Nodes can generate a query to fetch the next page', () => {
    const nextPageQuery = graph.shop.collections.nextPageQuery();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query {
      shop {
        collections (first: 1, after: ${collectionCursor}) {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              id
              handle
            }
          }
        }
      }
    }`));
  });
});
