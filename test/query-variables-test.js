import assert from 'assert';
import Query from '../src/query';
import variable, {VariableDefinition} from '../src/variable';
import createEnum from '../src/enum';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

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

  test('it will return a string when toVariableDefinitionString is called for scalars', () => {
    const intVariable = variable('intVariable', 'Int', 33);
    const stringVariable = variable('stringVariable', 'String', 'default');
    const booleanVariable = variable('booleanVariable', 'Boolean', false);
    const floatVariable = variable('floatVariable', 'Float', 0.333);
    const floatVariableE = variable('floatVariableE', 'Float', 0.33e3);
    const enumVariable = variable('enumVariable', 'FancyEnum', createEnum('FANCY_ENUM'));
    const inputObjectVariable = variable('inputObjectVariable', 'InputObject', {one: 1, two: 'two', three: true});

    assert.equal(intVariable.toVariableDefinitionString(), '$intVariable:Int=33');
    assert.equal(stringVariable.toVariableDefinitionString(), '$stringVariable:String="default"');
    assert.equal(booleanVariable.toVariableDefinitionString(), '$booleanVariable:Boolean=false');
    assert.equal(floatVariable.toVariableDefinitionString(), '$floatVariable:Float=0.333');
    assert.equal(floatVariableE.toVariableDefinitionString(), '$floatVariableE:Float=330');
    assert.equal(enumVariable.toVariableDefinitionString(), '$enumVariable:FancyEnum=FANCY_ENUM');
    assert.equal(inputObjectVariable.toVariableDefinitionString(), '$inputObjectVariable:InputObject={one: 1 two: "two" three: true}');
  });

  test('it will return a string when toVariableDefinitionString is called for lists', () => {
    const listIntVariable = variable('listIntVariable', '[Int]', [1, 2, 3]);
    const listStringVariable = variable('listStringVariable', '[String]', ['1', '2', '3']);
    const listBooleanVariable = variable('listBooleanVariable', '[Boolean]', [true, false, true]);
    const listFloatVariable = variable('listFloatVariable', '[Float]', [0.1, 0.2, 0.3]);
    const listEnumVariable = variable('listEnumVariable', '[FancyEnum]', [createEnum('ENUM1'), createEnum('ENUM2'), createEnum('ENUM3')]);
    const listObjectVariable = variable('listObjectVariable', '[InputObject]', [{one: true, two: 2}, {one: false, two: 3}, {one: false, two: 4}]);
    const list2DFloatVariable = variable('list2DFloatVariable', '[[Float]]', [[0.1, 0.2, 0.3]]);

    assert.equal(listIntVariable.toVariableDefinitionString(), '$listIntVariable:[Int]=[1 2 3]');
    assert.equal(listStringVariable.toVariableDefinitionString(), '$listStringVariable:[String]=["1" "2" "3"]');
    assert.equal(listBooleanVariable.toVariableDefinitionString(), '$listBooleanVariable:[Boolean]=[true false true]');
    assert.equal(listFloatVariable.toVariableDefinitionString(), '$listFloatVariable:[Float]=[0.1 0.2 0.3]');
    assert.equal(listEnumVariable.toVariableDefinitionString(), '$listEnumVariable:[FancyEnum]=[ENUM1 ENUM2 ENUM3]');
    assert.equal(listObjectVariable.toVariableDefinitionString(), '$listObjectVariable:[InputObject]=[{one: true two: 2} {one: false two: 3} {one: false two: 4}]');
    assert.equal(list2DFloatVariable.toVariableDefinitionString(), '$list2DFloatVariable:[[Float]]=[[0.1 0.2 0.3]]');
  });

  test('it will throw errors with invalid types', () => {
    const typeAndValue = {
      String: 'test string',
      Boolean: true,
      Int: 10,
      Float: 10.1
    };

    const types = Object.keys(typeAndValue);
    const values = types.map((type) => { return typeAndValue[type]; });

    // test values which should throw errors
    // all of them should be incompatible except using Int with a float
    types.forEach((type, i) => {
      values.forEach((value, j) => {
        // we do not want test against the current type against itself or float against int because
        // an int is a valid float
        if (i !== j && !(type === 'Float' && types[j] === 'Int')) {
          assert.throws(() => {
            variable('testName', type, value);
          }, `Should have thrown error- ${type} with value ${JSON.stringify(value)}`);
        }
      });
    });
  });

  test('it will not throw an error when Int is used in a Float', () => {
    let threwError = false;

    try {
      variable('testName', 'Float', 10);
    } catch (error) {
      threwError = true;
    }

    assert.ok(!threwError, 'Int values can be used in Float');
  });
});
