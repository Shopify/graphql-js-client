import assert from 'assert';
import decode from '../src/decode';
import Query from '../src/query';
import SelectionSet, {FragmentDefinition} from '../src/selection-set';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

suite('decode-named-fragment-test', () => {

  const name = 'Snow Devil';
  const data = {shop: {name}};

  const fragment = new FragmentDefinition('shopFragment', 'Shop', new SelectionSet(typeBundle, 'Shop', (shop) => {
    shop.add('name');
  }));

  test('it can decode data from a query with named fragments', () => {
    const query = new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.addFragment(fragment.spread);
      });
    });
    const decoded = decode(query, data);

    assert.equal(decoded.shop.name, name);
  });

  test('it can decode deeply nested fragments', () => {
    const selections = new SelectionSet(typeBundle, 'Shop', (shop) => {
      shop.add('currencyCode');
      shop.addFragment(fragment.spread);
    });
    const fragmentWithNestedFragment = new FragmentDefinition('complexShopFragment', 'Shop', selections);
    const currencyCode = 'CAD';
    const complexData = {shop: {name, currencyCode}};

    const complexQuery = new Query(typeBundle, (root) => {
      root.add('shop', (shop) => {
        shop.addFragment(fragmentWithNestedFragment.spread);
      });
    });
    const decoded = decode(complexQuery, complexData);

    assert.equal(decoded.shop.name, name);
    assert.equal(decoded.shop.currencyCode, currencyCode);
  });
});
