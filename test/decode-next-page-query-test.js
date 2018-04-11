import assert from 'assert';
import decode from '../src/decode';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import variable from '../src/variable';
import Query from '../src/query';
import Document from '../src/document';

suite('decode-next-page-query-test', () => {
  const collectionId = 'gid://shopify/Collection/67890';
  const collectionCursor = 'collection-cursor';
  const productId = 'gid://shopify/Product/72727';
  const variantsCursor = 'variants-cursor';
  const fixture = {
    data: {
      shop: {
        name: 'my-shop',
        collections: {
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false
          },
          edges: [{
            cursor: collectionCursor,
            node: {
              id: collectionId,
              handle: 'fancy-poles'
            }
          }]
        },
        products: {
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false
          },
          edges: [{
            cursor: 'product-cursor',
            node: {
              id: productId,
              handle: 'some-product',
              variants: {
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false
                },
                edges: [{
                  cursor: variantsCursor,
                  node: {
                    id: 'gid://shopify/ProductVariant/72727',
                    title: 'large'
                  }
                }]
              }
            }
          }]
        }
      }
    }
  };

  let decoded;
  let query;

  const querySplitter = /[\s,:]+/;

  function tokens(queryString) {
    return queryString.trim().split(querySplitter).filter((token) => Boolean(token));
  }

  setup(() => {
    query = new Query(typeBundle, (root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
        shop.addConnection('collections', {args: {first: 1}}, (collections) => {
          collections.addField('handle');
        });
        shop.addConnection('products', {args: {first: 1}}, (products) => {
          products.addField('handle');
          products.addConnection('variants', {args: {first: 1}}, (variants) => {
            variants.addField('title');
          });
        });
      });
    });

    decoded = decode(query, fixture.data);
  });

  test('Arrays of Nodes can generate a query to fetch the next page', () => {
    const [nextPageQuery, path] = decoded.shop.collections[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query ($first:Int = 1) {
      shop {
        collections (first: $first, after: "${collectionCursor}") {
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

    assert.deepEqual(path, ['shop', 'collections']);
  });

  test('Arrays of Nodes can generate a query to fetch the next page', () => {
    const [_, pathFirstCall] = decoded.shop.collections[0].nextPageQueryAndPath();
    const [__, pathSecondCall] = decoded.shop.collections[0].nextPageQueryAndPath();

    assert.deepEqual(pathFirstCall, ['shop', 'collections']);
    assert.deepEqual(pathFirstCall, pathSecondCall);
  });

  test('Arrays of Nodes nested under a truncated query to fetch their next page', () => {
    const [nextPageQuery, path] = decoded.shop.products[0].variants[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query ($first:Int = 1) {
      node (id: "${productId}") {
        __typename
        ... on Product {
          id
          variants (first: $first, after: "${variantsCursor}") {
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              cursor
              node {
                id
                title
              }
            }
          }
        }
      }
    }`));

    assert.deepEqual(path, ['node', 'variants']);
  });

  test('it can generate a query off of a node with intermediate objects', () => {
    const nestedObjectsQuery = new Query(typeBundle, (root) => {
      root.addField('arbitraryViewer', (viewer) => {
        viewer.addField('aNode', (node) => {
          node.addField('hostObject', {alias: 'hostObjectAlias'}, (host) => {
            host.addField('anotherHost', (anotherHost) => {
              anotherHost.addConnection('products', {alias: 'productsAlias', args: {first: 1}}, (products) => {
                products.addField('handle');
              });
            });
          });
        });
      });
    });
    const productCursor = 'product-cursor';
    const nestedObjectFixture = {
      data: {
        arbitraryViewer: {
          aNode: {
            id: 'gid://shopify/ArbitraryNode/12345',
            hostObjectAlias: {
              anotherHost: {
                productsAlias: {
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false
                  },
                  edges: [{
                    cursor: productCursor,
                    node: {
                      id: productId,
                      handle: 'some-product'
                    }
                  }]
                }
              }
            }
          }
        }
      }
    };

    const decodedComplexChain = decode(nestedObjectsQuery, nestedObjectFixture.data);

    const [nextPageQuery, path] = decodedComplexChain.arbitraryViewer.aNode.hostObjectAlias.anotherHost.productsAlias[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query ($first:Int = 1) {
      node (id: "gid://shopify/ArbitraryNode/12345") {
        __typename
        ... on ArbitraryNode {
          id
          hostObjectAlias: hostObject {
            anotherHost {
              productsAlias: products (first: $first, after: "${productCursor}") {
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
          }
        }
      }
    }`));

    assert.deepEqual(path, ['node', 'hostObjectAlias', 'anotherHost', 'productsAlias']);
  });

  test('it can generate the next page query for a query with variables off a nearest `Node`', () => {
    const variables = [variable('sort', 'ProductSortKeys')];
    const variablesQuery = new Query(typeBundle, variables, (root) => {
      root.add('node', {args: {id: 'gid://shopify/Collection/12345'}}, (node) => {
        node.addInlineFragmentOn('Collection', (collection) => {
          collection.addConnection('products', {args: {first: 1, sortKey: variables[0]}}, (products) => {
            products.add('handle');
          });
        });
      });
    });
    const productCursor = 'product-cursor';
    const variablesFixture = {
      data: {
        node: {
          id: 'gid://shopify/Collection/12345',
          products: {
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false
            },
            edges: [{
              cursor: productCursor,
              node: {
                id: productId,
                handle: 'some-product'
              }
            }]
          }
        }
      }
    };

    const decodedDataFromRequestWithVariables = decode(variablesQuery, variablesFixture.data);

    const [nextPageQuery] = decodedDataFromRequestWithVariables.node.products[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`
      query ($sort: ProductSortKeys, $first: Int = 1) {
        node (id: "gid://shopify/Collection/12345") {
          __typename
          ... on Collection {
            id
            products (first: $first, sortKey: $sort,  after: "${productCursor}") {
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
        }
      }
    `));
  });

  test('it can generate the next page query for a query with variables with no parent `Node`s', () => {
    const variables = [variable('sort', 'ProductSortKeys')];
    const variablesQuery = new Query(typeBundle, variables, (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('products', {args: {first: 1, sortKey: variables[0]}}, (products) => {
          products.add('handle');
        });
      });
    });
    const cursor = 'product-cursor';
    const variablesFixture = {
      data: {
        shop: {
          products: {
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false
            },
            edges: [{
              cursor,
              node: {
                id: productId,
                handle: 'some-product'
              }
            }]
          }
        }
      }
    };

    const decodedDataFromRequestWithVariables = decode(variablesQuery, variablesFixture.data);

    const [nextPageQuery] = decodedDataFromRequestWithVariables.shop.products[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`
      query ($sort: ProductSortKeys, $first: Int = 1) {
        shop {
          products (first: $first, sortKey: $sort,  after: "${cursor}") {
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
      }
    `));
  });

  test('it doesn\'t duplicate the "first" var if it\'s passed as variable instead of a literal', () => {
    const variables = [variable('first', 'Int', 1), variable('sort', 'ProductSortKeys')];
    const variablesQuery = new Query(typeBundle, variables, (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('products', {args: {first: variables[0], sortKey: variables[1]}}, (products) => {
          products.add('handle');
        });
      });
    });
    const cursor = 'product-cursor';
    const variablesFixture = {
      data: {
        shop: {
          products: {
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false
            },
            edges: [{
              cursor,
              node: {
                id: productId,
                handle: 'some-product'
              }
            }]
          }
        }
      }
    };

    const decodedDataFromRequestWithVariables = decode(variablesQuery, variablesFixture.data);

    const [nextPageQuery] = decodedDataFromRequestWithVariables.shop.products[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`
      query ($first: Int = 1, $sort: ProductSortKeys) {
        shop {
          products (first: $first, sortKey: $sort,  after: "${cursor}") {
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
      }
    `));
  });

  test('it can generated the next page query when selections include named fragments', () => {
    const variables = [variable('sort', 'ProductSortKeys')];
    const cursor = 'product-cursor';
    const fragmentFixture = {
      data: {
        shop: {
          products: {
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false
            },
            edges: [{
              cursor,
              node: {
                id: productId,
                handle: 'some-product'
              }
            }]
          }
        }
      }
    };
    const document = new Document(typeBundle);
    const fragment = document.defineFragment('ProductFragment', 'Product', (product) => {
      product.add('handle');
    });

    document.addQuery(variables, (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('products', {args: {first: 1, sortKey: variables[0]}}, (products) => {
          products.add(fragment);
        });
      });
    });

    const decodedFromFragments = decode(document.operations[0], fragmentFixture.data);

    const [nextPageQuery] = decodedFromFragments.shop.products[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`
      fragment ProductFragment on Product {
        id
        handle
      }
      query ($sort: ProductSortKeys, $first: Int = 1) {
        shop {
          products (first: $first, sortKey: $sort,  after: "${cursor}") {
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              cursor
              node {
                ...ProductFragment
              }
            }
          }
        }
      }
    `));
  });

  test('it retains variable values on multiple next-page-queries', () => {
    const variables = [variable('first', 'Int', 1)];
    const cursor = 'product-cursor';
    const fragmentFixture = {
      data: {
        shop: {
          products: {
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false
            },
            edges: [{
              cursor,
              node: {
                id: productId
              }
            }]
          }
        }
      }
    };
    const document = new Document(typeBundle);

    document.addQuery(variables, (root) => {
      root.add('shop', (shop) => {
        shop.addConnection('products', {args: {first: variables[0]}}, (products) => {
          products.add('id');
        });
      });
    });

    const decodedPageOne = decode(document.operations[0], fragmentFixture.data);

    const [pageTwoQuery] = decodedPageOne.shop.products[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(pageTwoQuery.toString()), tokens(`
      query ($first: Int = 1) {
        shop {
          products (first: $first, after: "${cursor}") {
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      }
    `), 'page two query is as expected');

    const decodedPageTwo = decode(pageTwoQuery.operations[0], fragmentFixture.data);

    const [pageThreeQuery] = decodedPageTwo.shop.products[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(pageThreeQuery.toString()), tokens(`
      query ($first: Int = 1) {
        shop {
          products (first: $first, after: "${cursor}") {
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      }
    `), 'page three query is as expected');
  });
});
