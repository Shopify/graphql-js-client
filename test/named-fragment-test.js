import assert from 'assert';
import SelectionSet, {FragmentDefinition} from '../src/selection-set';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved
import assertDeeplyFrozen from './assert-deeply-frozen';

suite('named-fragment-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  const typeName = 'Product';

  const selections = new SelectionSet(typeBundle, typeName, (product) => {
    product.add('title');
  });

  test('it can render as a definition', () => {
    const definition = new FragmentDefinition('sickFragment', typeName, selections);

    assert.deepEqual(tokens(definition.toString()), tokens(`
      fragment sickFragment on Product {
        id
        title
      }
    `));
  });

  test('it can render a fragment spread', () => {
    const definition = new FragmentDefinition('sickFragment', typeName, selections);

    assert.deepEqual(definition.spread.toString(), '...sickFragment');
  });

  test('it can generate a definition from a spread', () => {
    const definition = new FragmentDefinition('sickFragment', typeName, selections);
    const spread = definition.spread;

    assert.equal(spread.toDefinition().toString(), definition.toString());
  });

  test('it is deeply frozen after being built.', () => {
    const definition = new FragmentDefinition('sickFragment', typeName, selections);

    assertDeeplyFrozen(definition);
  });
});
