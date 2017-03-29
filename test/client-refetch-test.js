import assert from 'assert';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Client from '../src/client';
import decode from '../src/decode';

suite('client-refetch-test', () => {
  let params;
  let decoded;
  const id = 1;
  const title = 'hammer';
  const typename = 'Product';

  const initialData = {
    shop: {
      products: {
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false
        },
        edges: [
          {
            cursor: 'abc123',
            node: {
              id,
              title
            }
          }
        ]
      }
    }
  };


  const refetchData = {
    node: {
      __typename: typename,
      id,
      title
    }
  };

  function fetcher(graphQLParams) {
    params = graphQLParams;

    return Promise.resolve({data: refetchData});
  }

  const mockClient = new Client(typeBundle, {fetcher});

  const initialQuery = mockClient.query((root) => {
    root.add('shop', (shop) => {
      shop.addConnection('products', {args: {first: 1}}, (product) => {
        product.add('title');
      });
    });
  });

  setup(() => {
    params = null;
    decoded = decode(initialQuery, initialData);
  });

  test('it can refetch nodes', () => {
    return mockClient.refetch(decoded.shop.products[0]).then((model) => {
      assert.deepEqual(params, {query: decoded.shop.products[0].refetchQuery().toString()});
      assert.deepEqual(model.id, id);
      assert.deepEqual(model.title, title);
      assert.equal(model.type.name, typename);
    });
  });

  test('it throws when you refetch not a node', () => {
    return assert.throws(() => {
      mockClient.refetch(decoded.shop);
    }, /'client#refetch' must be called with a type that implements Node. Received Shop./);
  });

  test('it throws when you refetch a null value', () => {
    return assert.throws(() => {
      mockClient.refetch(null);
    }, /'client#refetch' must be called with a non-null instance of a Node./);
  });
});
