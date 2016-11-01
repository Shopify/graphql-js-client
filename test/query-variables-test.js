import assert from 'assert';
import Query from '../src/query';
import variable, {VariableDefinition} from '../src/variable';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import createEnum from '../src/enum';

suite('Unit | Query Variables', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter);
  }

  test('it can create variables', () => {
    const variableId = variable('id', 'ID!');

    assert.ok(VariableDefinition.prototype.isPrototypeOf(variableId));
  });

  test('it can use variables with fields', () => {
    const variableId = variable('id', 'ID!');

    const query = new Query(typeBundle, [variableId], (root) => {
      root.addField('product', {id: variableId}, (product) => {
        product.addField('title');
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query ($id:ID!) {
      product (id: $id) {
        title
      }
    }`));
  });

  test('it can use variables when a query is named', () => {
    const variableId = variable('id', 'ID!');

    const query = new Query(typeBundle, 'bestQueryEver', [variableId], (root) => {
      root.addField('product', {id: variableId}, (product) => {
        product.addField('title');
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query bestQueryEver ($id:ID!) {
      product (id: $id) {
        title
      }
    }`));
  });

  test('it can use variables with connections', () => {
    const variableCount = variable('count', 'Int!');
    const variableAfter = variable('after', 'String');

    const query = new Query(typeBundle, [variableCount, variableAfter], (root) => {
      root.addField('shop', (shop) => {
        shop.addConnection('products', {first: variableCount, after: variableAfter}, (product) => {
          product.addField('title');
        });
      });
    });

    assert.deepEqual(tokens(query.toString()), tokens(`query ($count:Int! $after:String) {
      shop {
        products (first: $count after: $after) {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              title
            }
          }
        }
      }
    }`));
  });

  test('it throws an error with default value and not null', () => {
    assert.throws(
      () => {
        variable('variableNN', 'String!', 'I am default');
      },
      /You cannot use a default value when using a non-null type/
    );
  });

  test('it will return a string when toVariableDefinitionString is called', () => {
    const intVariable = variable('variableInt', 'Int', 33);
    const stringVariable = variable('variableString', 'String', 'default');
    const booleanVariable = variable('variableBoolean', 'Boolean', false);
    const floatVariable = variable('variableFloat', 'Float', 0.333);
    const floatVariableE = variable('variableFloatE', 'Float', 0.33e3);
    const listVariable = variable('variableList', 'List', [1, 2, 3]);
    const enumVariable = variable('variableEnum', 'Enum', createEnum('AN_ENUM'));
    const objectVariable = variable('variableObject', 'Object', {value1: 1, value2: 2});
    const objectVariableNull = variable('variableObjectNull', 'Object', null);

    assert.equal(intVariable.toVariableDefinitionString(), '$variableInt:Int=33');
    assert.equal(stringVariable.toVariableDefinitionString(), '$variableString:String="default"');
    assert.equal(booleanVariable.toVariableDefinitionString(), '$variableBoolean:Boolean=false');
    assert.equal(floatVariable.toVariableDefinitionString(), '$variableFloat:Float=0.333');
    assert.equal(floatVariableE.toVariableDefinitionString(), '$variableFloatE:Float=330');
    assert.equal(listVariable.toVariableDefinitionString(), '$variableList:List=[1 2 3]');
    assert.equal(enumVariable.toVariableDefinitionString(), '$variableEnum:Enum=AN_ENUM');
    assert.equal(objectVariable.toVariableDefinitionString(), '$variableObject:Object={value1: 1 value2: 2}');
    assert.equal(objectVariableNull.toVariableDefinitionString(), '$variableObjectNull:Object=null');
  });

  test('it will validate variable types', () => {
    const typeAndValue = {
      String: 'test string',
      Boolean: true,
      Object: {},
      Int: 10,
      Float: 10.1,
      List: ['something']
    };

    const types = Object.keys(typeAndValue);
    const values = types.map((type) => { return typeAndValue[type]; });

    // test values which should throw errors
    // all of them should be incompatible except using Int with a float
    types.forEach((type, i) => {
      values.forEach((value, j) => {
        if (i !== j && !(type === 'Float' && types[j] === 'Int')) {
          assert.throws(() => {
            variable('testName', type, value);
          }, `Should have thrown error- ${type} with value ${JSON.stringify(value)}`);
        }
      });
    });

    // test values which should not throw errors
    types.forEach((type, i) => {
      const value = values[i];
      let threwError = false;

      try {
        variable('testName', type, value);
      } catch (error) {
        threwError = true;
      }

      assert.ok(!threwError, `Should not have thrown error- ${type} with value ${JSON.stringify(value)}`);
    });
  });
});
