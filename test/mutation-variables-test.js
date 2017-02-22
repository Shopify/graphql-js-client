import assert from 'assert';
import Mutation from '../src/mutation';
import variable from '../src/variable';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('mutation-variables-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  test('it can use variables with fields', () => {
    const inputVariable = variable('input', 'ApiCustomerAccessTokenCreateInput!');

    const mutation = new Mutation(typeBundle, [inputVariable], (root) => {
      root.add('apiCustomerAccessTokenCreate', {args: {input: inputVariable}}, (apiCustomerAccessTokenCreate) => {
        apiCustomerAccessTokenCreate.add('apiCustomerAccessToken', (apiCustomerAccessToken) => {
          apiCustomerAccessToken.add('accessToken');
        });
      });
    });


    assert.deepEqual(tokens(mutation.toString()), tokens(`mutation ($input:ApiCustomerAccessTokenCreateInput!)  {
      apiCustomerAccessTokenCreate (input: $input) {
        apiCustomerAccessToken {
          id,
          accessToken
        }
      }
    }`));
  });

  test('it can use variables with a default value', () => {
    const inputVariable = variable('input', 'ApiCustomerAccessTokenCreateInput!', {email: 'email@domain.com', password: 'test123'});

    const mutation = new Mutation(typeBundle, [inputVariable], (root) => {
      root.add('apiCustomerAccessTokenCreate', {args: {input: inputVariable}}, (apiCustomerAccessTokenCreate) => {
        apiCustomerAccessTokenCreate.add('apiCustomerAccessToken', (apiCustomerAccessToken) => {
          apiCustomerAccessToken.add('accessToken');
        });
      });
    });

    assert.deepEqual(tokens(mutation.toString()), tokens(`mutation ($input:ApiCustomerAccessTokenCreateInput! = {email: "email@domain.com", password: "test123"})  {
      apiCustomerAccessTokenCreate (input: $input) {
        apiCustomerAccessToken {
          id,
          accessToken
        }
      }
    }`));
  });

  test('it can use variables when a mutation is named', () => {
    const inputVariable = variable('input', 'ApiCustomerAccessTokenCreateInput!');
    const mutation = new Mutation(typeBundle, 'bestMutationEver', [inputVariable], (root) => {
      root.add('apiCustomerAccessTokenCreate', {args: {input: inputVariable}}, (apiCustomerAccessTokenCreate) => {
        apiCustomerAccessTokenCreate.add('apiCustomerAccessToken', (apiCustomerAccessToken) => {
          apiCustomerAccessToken.add('accessToken');
        });
      });
    });

    assert.deepEqual(tokens(mutation.toString()), tokens(`mutation bestMutationEver ($input:ApiCustomerAccessTokenCreateInput!)  {
      apiCustomerAccessTokenCreate (input: $input) {
        apiCustomerAccessToken {
          id,
          accessToken
        }
      }
    }`));
  });
});
