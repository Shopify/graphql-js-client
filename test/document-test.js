import assert from 'assert';
import Query from '../src/query';
import Document from '../src/document';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('document-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  function buildQuery(root) {
    root.add('shop', (shop) => {
      shop.add('name');
    });
  }

  test('it passes the QueryRoot to the query callback ', () => {
    const doc = new Document(typeBundle);
    let rootType = null;

    doc.addQuery((root) => {
      rootType = root.typeSchema;
    });

    assert.deepEqual(typeBundle.QueryRoot, rootType);
  });

  test('it can stringify a single query document', () => {
    const doc = new Document(typeBundle);

    doc.addQuery(buildQuery);

    assert.deepEqual(tokens(doc.toString()), tokens('query { shop { name } }'));
  });

  test('it can build a named query', () => {
    const doc = new Document(typeBundle);

    doc.addQuery('myQuery', buildQuery);

    assert.deepEqual(tokens(doc.toString()), tokens('query myQuery { shop { name } }'));
  });

  test('it supports multiple named queries', () => {
    const doc = new Document(typeBundle);

    doc.addQuery('one', buildQuery);
    doc.addQuery('two', buildQuery);

    assert.deepEqual(tokens(doc.toString()), tokens(`
      query one { shop { name } }
      query two { shop { name } }
    `));
  });

  test('it throws an error if you have more than one unnamed query', () => {
    const doc = new Document(typeBundle);

    doc.addQuery(buildQuery);

    assert.throws(() => {
      doc.addQuery(buildQuery);
    });
  });

  test('it throws an error if you have more than one query and any are unnamed', () => {
    const doc = new Document(typeBundle);

    doc.addQuery('myQuery', buildQuery);

    assert.throws(() => {
      doc.addQuery(buildQuery);
    });
  });

  test('it can add an anonymous query from an instance', () => {
    const doc = new Document(typeBundle);
    const query = new Query(typeBundle, buildQuery);

    doc.addQuery(query);

    assert.deepEqual(tokens(doc.toString()), tokens('query { shop { name } }'));
  });

  test('it can add a named query from an instance', () => {
    const doc = new Document(typeBundle);
    const query = new Query(typeBundle, 'myQuery', buildQuery);

    doc.addQuery(query);

    assert.deepEqual(tokens(doc.toString()), tokens('query myQuery { shop { name } }'));
  });

  test('it throws when passing multiple unnamed queries as instances', () => {
    const doc = new Document(typeBundle);
    const queryOne = new Query(typeBundle, buildQuery);
    const queryTwo = new Query(typeBundle, 'two', buildQuery);

    doc.addQuery(queryOne);

    assert.throws(() => {
      doc.addQuery(queryTwo);
    });
  });

  test('it will receive multiple named query instances', () => {
    const doc = new Document(typeBundle);
    const queryOne = new Query(typeBundle, 'one', buildQuery);
    const queryTwo = new Query(typeBundle, 'two', buildQuery);

    doc.addQuery(queryOne);
    doc.addQuery(queryTwo);

    assert.deepEqual(tokens(doc.toString()), tokens(`
      query one { shop { name } }
      query two { shop { name } }
    `));
  });

  test('it throws when query names are not unique', () => {
    const doc = new Document(typeBundle);
    const query = new Query(typeBundle, 'myQuery', buildQuery);

    doc.addQuery(query);

    assert.throws(() => {
      doc.addQuery(query);
    });
  });
});
