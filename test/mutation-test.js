import assert from 'assert';
import Mutation from '../src/mutation';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import variable from '../src/variable';

suite('Unit | Mutation', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  function buildMutation(root, variables) {
    const {clientMutationId = '1234', email = 'some@email.com', password = 'some-password'} = variables || {};

    const fieldArgs = {
      input: {
        clientMutationId,
        email,
        password
      }
    };

    root.addField('apiCustomerAccessTokenCreate', fieldArgs, (mutationResult) => {
      mutationResult.addField('clientMutationId');
      mutationResult.addField('userErrors', (userErrors) => {
        userErrors.addField('message');
        userErrors.addField('field');
      });
      mutationResult.addField('apiCustomerAccessToken', (apiCustomerAccessToken) => {
        apiCustomerAccessToken.addField('id');
        apiCustomerAccessToken.addField('expiresAt');
        apiCustomerAccessToken.addField('accessToken');
      });
    });
  }

  test('constructor takes a typeBundle and a callback which is called with the query\'s SelectionSet', () => {
    const query = new Mutation(typeBundle, (root) => {
      buildMutation(root);
    });

    assert.deepEqual(tokens(query.toString()), tokens(`
      mutation { 
        apiCustomerAccessTokenCreate (input: {clientMutationId: "1234" email: "some@email.com" password: "some-password"}) { 
          clientMutationId,
          userErrors {
            message,
            field
          },
          apiCustomerAccessToken {
            id,
            expiresAt,
            accessToken
          } 
        }
      }
    `));
  });

  test('constructor takes a typeBundle, a name, and a callback rendering a named query', () => {
    const query = new Mutation(typeBundle, 'myMutation', (root) => {
      buildMutation(root);
    });

    assert.deepEqual(tokens(query.toString()), tokens(`
      mutation myMutation { 
        apiCustomerAccessTokenCreate (input: {clientMutationId: "1234" email: "some@email.com" password: "some-password"}) { 
          clientMutationId,
          userErrors {
            message,
            field
          },
          apiCustomerAccessToken {
            id,
            expiresAt,
            accessToken
          } 
        }
      }
    `));
  });

  test('constructor takes a typeBundle, query variables, and a callback which is called with the query\'s SelectionSet', () => {
    const emailVariable = variable('email', 'String');

    const query = new Mutation(typeBundle, [emailVariable], (root) => {
      buildMutation(root, {email: emailVariable});
    });

    assert.deepEqual(tokens(query.toString()), tokens(`
      mutation ($email:String) { 
        apiCustomerAccessTokenCreate (input: {clientMutationId: "1234" email: $email password: "some-password"}) { 
          clientMutationId,
          userErrors {
            message,
            field
          },
          apiCustomerAccessToken {
            id,
            expiresAt,
            accessToken
          } 
        }
      }
    `));
  });

  test('constructor takes a typeBundle, name, query variables, and a callback which is called with the query\'s SelectionSet', () => {
    const emailVariable = variable('email', 'String');

    const query = new Mutation(typeBundle, 'myMutation', [emailVariable], (root) => {
      buildMutation(root, {email: emailVariable});
    });

    assert.deepEqual(tokens(query.toString()), tokens(`
      mutation myMutation ($email:String) { 
        apiCustomerAccessTokenCreate (input: {clientMutationId: "1234" email: $email password: "some-password"}) { 
          clientMutationId,
          userErrors {
            message,
            field
          },
          apiCustomerAccessToken {
            id,
            expiresAt,
            accessToken
          } 
        }
      }
    `));
  });

  test('it identifies anonymous queries', () => {
    const query = new Mutation(typeBundle, buildMutation);

    assert.equal(query.isAnonymous, true);
  });

  test('it identifies named queries as not anonymous', () => {
    const query = new Mutation(typeBundle, 'myQuery', buildMutation);

    assert.equal(query.isAnonymous, false);
  });
});
