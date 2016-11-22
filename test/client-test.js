import assert from 'assert';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import Client from '../src/client';
import Document from '../src/document';
import Query from '../src/query';
import GraphModel from '../src/graph-model';


suite('client-test', () => {
  const client = new Client(typeBundle, '/graphql');

  test('it has a type bundle', () => {
    assert.deepEqual(client.typeBundle, typeBundle);
  });

  test('it builds documents', () => {
    const clientDocument = client.document();
    const expectedDocument = new Document(typeBundle);

    assert.deepEqual(clientDocument, expectedDocument);
  });

  test('it builds queries', () => {
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

  test('it sends queries', () => {
    let fetcherParams = null;
    const mockingClient = new Client(typeBundle, (graphQLParams) => {
      fetcherParams = graphQLParams;

      return Promise.resolve({data: {shop: {name: 'Snowdevil'}}});
    });

    const query = mockingClient.query((root) => {
      root.addField('shop', (shop) => {
        shop.addField('name');
      });
    });

    return mockingClient.send(query).then((response) => {
      assert.deepEqual(fetcherParams, {query: query.toString()});
      assert.deepEqual(response, {
        data: {shop: {name: 'Snowdevil'}},
        model: new GraphModel({shop: new GraphModel({name: 'Snowdevil'})})
      });
    });
  });
});
