import assert from 'assert';
import decode from '../src/decode';
import Query from '../src/query';
import typeBundle from '../fixtures/types'; // eslint-disable-line import/no-unresolved

const checkoutQuery = new Query(typeBundle, (root) => {
  root.add('node', {args: {id: 'gid://shopify/Checkout/1'}}, (node) => {
    node.addInlineFragmentOn('Checkout', (checkout) => {
      checkout.add('discountApplication', (discount) => {
        discount.add('targetSelection');
        discount.add('targetType');
        discount.addInlineFragmentOn('DiscountCodeApplication', (application) => {
          application.add('code');
        });
      });
    });
  });
});

suite('decode-unknown-type-test', () => {
  test('it decodes an interface into a type', () => {
    const data = {
      node: {
        __typename: 'Checkout',
        discountApplication: {
          __typename: 'DiscountCodeApplication',
          targetSelection: 'ALL',
          targetType: 'SHIPPING_LINE',
          code: 'SHIPPINGFREE'
        }
      }
    };

    const decoded = decode(checkoutQuery, data);

    assert.ok(decoded);
    assert.equal(decoded.node.discountApplication.type.name, 'DiscountCodeApplication');
    assert.equal(decoded.node.discountApplication.targetSelection, data.node.discountApplication.targetSelection);
    assert.equal(decoded.node.discountApplication.targetType, data.node.discountApplication.targetType);
    assert.equal(decoded.node.discountApplication.code, data.node.discountApplication.code);
  });

  test('it decodes an unknown interface into a base type', () => {
    const data = {
      node: {
        __typename: 'Checkout',
        discountApplication: {
          __typename: 'AutomaticDiscountApplication',
          targetSelection: 'ALL',
          targetType: 'SHIPPING_LINE'
        }
      }
    };

    const decoded = decode(checkoutQuery, data);

    assert.ok(decoded);
    assert.equal(decoded.node.discountApplication.type.name, 'DiscountApplication');
    assert.equal(decoded.node.discountApplication.targetSelection, data.node.discountApplication.targetSelection);
    assert.equal(decoded.node.discountApplication.targetType, data.node.discountApplication.targetType);
    assert.equal(decoded.node.discountApplication.code, null);
  });
});
