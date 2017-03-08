import assert from 'assert';
import decode from '../src/decode';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Query from '../src/query';

suite('decode-next-page-query-on-scalars-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(queryString) {
    return queryString.split(querySplitter).filter((token) => Boolean(token));
  }

  const cursor = 'scalar-cursor';
  const node = 'just-a-string';
  const data = {
    arbitraryViewer: {
      paginatedScalars: {
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false
        },
        edges: [{
          cursor,
          node
        }]
      }
    }
  };

  const query = new Query(typeBundle, (root) => {
    root.add('arbitraryViewer', (viewer) => {
      viewer.addConnection('paginatedScalars', {args: {first: 1}});
    });
  });

  test('it can decode paginated sets of scalars', () => {
    const decoded = decode(query, data);

    assert.ok(Array.isArray(decoded.arbitraryViewer.paginatedScalars));
    assert.equal(decoded.arbitraryViewer.paginatedScalars.length, 1);
    assert.equal(decoded.arbitraryViewer.paginatedScalars[0], node);
  });

  test('it can attach pagination queries and paths to scalar nodes', () => {
    const decoded = decode(query, data);
    const [nextPageQuery, path] = decoded.arbitraryViewer.paginatedScalars[0].nextPageQueryAndPath();

    assert.deepEqual(tokens(nextPageQuery.toString()), tokens(`query ($first:Int = 1) {
      arbitraryViewer {
        paginatedScalars (first: $first, after: "${cursor}") {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node
          }
        }
      }
    }`));

    assert.deepEqual(path, ['arbitraryViewer', 'paginatedScalars']);
  });
});
