import assert from 'assert';
import customTypeBundle from '../fixtures/custom-type-bundle';
import schemaForType from '../src/schema-for-type';
import Query from '../src/query';
import Mutation from '../src/mutation';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('schema-type-test', () => {
  test('queries use the query type from the schema', () => {
    let rootType = null;
    const query = new Query(customTypeBundle, (root) => {
      rootType = root.typeSchema;
    });

    assert.deepEqual(schemaForType(customTypeBundle, 'CustomQueryRoot'), rootType);
    assert.deepEqual(schemaForType(customTypeBundle, 'CustomQueryRoot'), query.typeSchema);
  });

  test('mutations use the mutation type from the schema', () => {
    let rootType = null;
    const mutation = new Mutation(customTypeBundle, (root) => {
      rootType = root.typeSchema;
    });

    assert.deepEqual(schemaForType(customTypeBundle, 'CustomMutation'), rootType);
    assert.deepEqual(schemaForType(customTypeBundle, 'CustomMutation'), mutation.typeSchema);
  });

  test('returns the correct type for an enum', () => {
    const currencyCodeType = typeBundle.types.CurrencyCode;

    assert.deepEqual(schemaForType(typeBundle, 'CurrencyCode'), currencyCodeType);
  });
});
