import assert from 'assert';
import assertDeeplyFrozen from './assert-deeply-frozen';
import Mutation from '../src/mutation';
import typeBundle from '../fixtures/types';
import variable from '../src/variable';
import schemaForType from '../src/schema-for-type';

suite('mutation-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  function buildMutation(root) {
    root.add('apiCustomerAccessTokenCreate', {args: {input: {email: 'email@domain.com', password: 'test123'}}}, (apiCustomerAccessTokenCreate) => {
      apiCustomerAccessTokenCreate.add('apiCustomerAccessToken', (apiCustomerAccessToken) => {
        apiCustomerAccessToken.add('accessToken');
      });
    });
  }

  test('constructor takes a typeBundle and a callback which is called with the mutation\'s SelectionSetBuilder', () => {
    let rootType = null;
    const mutation = new Mutation(typeBundle, (root) => {
      rootType = root.typeSchema;
      buildMutation(root);
    });

    assert.deepEqual(schemaForType(typeBundle, 'Mutation'), rootType);
    assert.deepEqual(tokens(mutation.toString()), tokens(`mutation {
      apiCustomerAccessTokenCreate (input: {email: "email@domain.com" password: "test123"}) {
        apiCustomerAccessToken {
          id,
          accessToken
        }
      }
    }`));
  });

  test('constructor takes a typeBundle, a name, and a callback rendering a named mutation', () => {
    let rootType = null;
    const mutation = new Mutation(typeBundle, 'myMutation', (root) => {
      rootType = root.typeSchema;
      buildMutation(root);
    });

    assert.deepEqual(schemaForType(typeBundle, 'Mutation'), rootType);
    assert.deepEqual(tokens(mutation.toString()), tokens(`mutation myMutation {
      apiCustomerAccessTokenCreate (input: {email: "email@domain.com", password: "test123"}) {
        apiCustomerAccessToken {
          id,
          accessToken
        }
      }
    }`));
  });

  test('it identifies anonymous mutations', () => {
    const mutation = new Mutation(typeBundle, buildMutation);

    assert.ok(mutation.isAnonymous);
  });

  test('it identifies named mutations as not anonymous', () => {
    const mutation = new Mutation(typeBundle, 'myMutation', buildMutation);

    assert.equal(mutation.isAnonymous, false);
  });

  test('mutations are deeply frozen once they\'ve been built', () => {
    const mutation = new Mutation(typeBundle, 'foo', buildMutation);

    assertDeeplyFrozen(mutation);
  });

  test('constructor copies variable definition list into new array', () => {
    const variables = [variable('input', 'ApiCustomerAccessTokenCreateInput!')];
    const mutation = new Mutation(typeBundle, 'foo', variables, buildMutation);

    variables.push(variable('foo', 'String'));
    assert.deepEqual(variables, [variable('input', 'ApiCustomerAccessTokenCreateInput!'), variable('foo', 'String')]);
    assert.deepEqual(mutation.variableDefinitions.variableDefinitions, [variable('input', 'ApiCustomerAccessTokenCreateInput!')]);
  });
});
