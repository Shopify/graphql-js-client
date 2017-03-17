import assert from 'assert';
import GraphModel from '../src/graph-model';
import Scalar from '../src/scalar';

suite('graph-model-test', () => {
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

  test('it unboxes scalars', () => {
    const model = new GraphModel({theBusiness: new Scalar(4)});

    assert.equal(typeof model.theBusiness, 'number');
    assert.ok(Scalar.prototype.isPrototypeOf(model.attrs.theBusiness));
  });
});
