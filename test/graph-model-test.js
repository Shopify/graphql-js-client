import assert from 'assert';
import GraphModel from '../src/graph-model';

suite('Unit | GraphHelpers | GraphModel', () => {
  const attrs = {
    beans: true,
    beanType: 'kidney'
  };

  test('it stores passed attrs under attrs', () => {

    const model = new GraphModel(attrs);

    assert.deepEqual(model.attrs, attrs);
  });

  test('it creates top level proxies for all keys', () => {

    const model = new GraphModel(attrs);

    assert.equal(model.beans, attrs.beans);
    assert.equal(model.beanType, attrs.beanType);
  });

  test('it creates read-only proxies', () => {

    const model = new GraphModel(attrs);

    assert.throws(() => {
      model.beans = 'Gosh darn beans';
    });
  });

  test('it doesn\'t overwrite existing keys', () => {

    class ModelWithBusinessLogic extends GraphModel {
      get beans() {
        return 'so-many';
      }
    }

    const model = new ModelWithBusinessLogic(attrs);

    assert.equal(model.beans, 'so-many');
    assert.equal(model.attrs.beans, attrs.beans);
    assert.equal(model.beanType, attrs.beanType);
  });
});
