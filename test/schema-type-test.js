import assert from 'assert';
import typeBundle from '../fixtures/custom-type-bundle';
import schemaForType from '../src/schema-for-type';
import Query from '../src/query';
import Mutation from '../src/mutation';

suite('schema-type-test', () => {
  test('queries use the query type from the schema', () => {
    let rootType = null;
    const query = new Query(typeBundle, (root) => {
      rootType = root.typeSchema;
    });

    assert.deepEqual(schemaForType(typeBundle, 'CustomQueryRoot'), rootType);
    assert.deepEqual(schemaForType(typeBundle, 'CustomQueryRoot'), query.typeSchema);
  });

  test('mutations use the mutation type from the schema', () => {
    let rootType = null;
    const mutation = new Mutation(typeBundle, (root) => {
      rootType = root.typeSchema;
    });

    assert.deepEqual(schemaForType(typeBundle, 'CustomMutation'), rootType);
    assert.deepEqual(schemaForType(typeBundle, 'CustomMutation'), mutation.typeSchema);
  });
});
