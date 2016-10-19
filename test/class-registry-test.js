import assert from 'assert';

import ClassRegistry from '../src/class-registry';
import GraphModel from '../src/graph-model';

suite('Unit | ClassRegistry', () => {
  test('it returns the defined constructor fot the type', () => {

    const registry = new ClassRegistry();

    // eslint-disable-next-line no-empty-function
    function MyClass() {}

    registry.registerClassForType(MyClass, 'SomeType');

    assert.equal(registry.classForType('SomeType'), MyClass);
  });

  test('it falls back to the GraphModel type when no types are available', () => {

    const registry = new ClassRegistry();

    assert.equal(registry.classForType('SomeType'), GraphModel);
  });

  test('it can unregister a class for a type', () => {

    const registry = new ClassRegistry();

    // eslint-disable-next-line no-empty-function
    function MyClass() {}

    registry.registerClassForType(MyClass, 'SomeType');

    assert.equal(registry.classForType('SomeType'), MyClass);

    registry.unregisterClassForType('SomeType');

    assert.equal(registry.classForType('SomeType'), GraphModel);
  });
});
