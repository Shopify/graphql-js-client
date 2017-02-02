import assert from 'assert';
import decode from '../src/decode';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('decode-refetch-query-test', () => {
  const productId = 'gid://shopify/Product/2';
  const fixture = {
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
                id: productId,
                handle: 'aluminum-pole'
              }
            },
            {
              cursor: 'eyJsYXN0X2lkIjozNjgwODg2NzIxLCJsYXN0X3ZhbHVlIjoiMzY4MDg4NjcyMSJ9',
              node: {
                id: 'gid://shopify/Product/2',
                handle: 'electricity-socket-with-jam'
              }
            },
            {
              cursor: 'eyJsYXN0X2lkIjo0MTQwMTI3MDQxLCJsYXN0X3ZhbHVlIjoiNDE0MDEyNzA0MSJ9',
              node: {
                id: 'gid://shopify/Product/3',
                handle: 'borktown'
              }
            }
          ]
        }
      }
    }
  };

  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  let query;
  let decoded;

  setup(() => {
    query = new Query(typeBundle, (root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
        shop.addConnection('products', (products) => {
          products.addField('handle');
        });
      });
    });

    decoded = decode(query, fixture.data);
  });

  test('Nodes can generate a query to refetch themselves', () => {
    const refetchQuery = decoded.shop.products[0].refetchQuery();

    assert.deepEqual(tokens(refetchQuery.toString()), tokens(`query {
      node (id: "${productId}") {
        __typename
        ... on Product {
          id
          handle
        }
      }
    }`));
  });
});
