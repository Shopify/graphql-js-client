import descriptorForField from './descriptor-for-field';
import ClassRegistry from './class-registry';

function extractDescriptors(typeBundle, objectGraph, typeName) {
  return Object.keys(objectGraph).map((fieldName) => {
    return descriptorForField(typeBundle, fieldName, typeName);
  });
}

function isScalar(descriptor) {
  return descriptor.kind === 'SCALAR';
}

function isObject(descriptor) {
  return descriptor.kind === 'OBJECT' && !descriptor.isConnection;
}

function isConnection(descriptor) {
  return descriptor.isConnection;
}

function extractScalars(objectGraph, descriptors) {
  const scalarDescriptors = descriptors.filter(isScalar);

  return scalarDescriptors.reduce((scalarAcc, descriptor) => {
    scalarAcc[descriptor.fieldName] = objectGraph[descriptor.fieldName];

    return scalarAcc;
  }, {});
}

function extractObjects(typeBundle, objectGraph, descriptors, registry) {
  const objectDescriptors = descriptors.filter(isObject);

  return objectDescriptors.reduce((objectAcc, descriptor) => {
    if (descriptor.isList) {
      objectAcc[descriptor.fieldName] = objectGraph[descriptor.fieldName].map((object) => {
        // eslint-disable-next-line no-use-before-define
        return deserializeObject(typeBundle, object, descriptor.type, registry);
      });
    } else {
      // eslint-disable-next-line no-use-before-define
      objectAcc[descriptor.fieldName] = deserializeObject(typeBundle, objectGraph[descriptor.fieldName], descriptor.type, registry);
    }

    return objectAcc;
  }, {});
}

function extractConnections(typeBundle, objectGraph, descriptors, registry) {
  const connectionDescriptors = descriptors.filter(isConnection);

  return connectionDescriptors.reduce((connectionsAcc, descriptor) => {
    const edgeDescriptor = descriptorForField(typeBundle, 'edges', descriptor.type);
    const nodeDescriptor = descriptorForField(typeBundle, 'node', edgeDescriptor.type);

    connectionsAcc[descriptor.fieldName] = objectGraph[descriptor.fieldName].edges.map((object) => {
      // eslint-disable-next-line no-use-before-define
      return deserializeObject(typeBundle, object.node, nodeDescriptor.type, registry);
    });

    return connectionsAcc;
  }, {});
}

export default function deserializeObject(typeBundle, objectGraph, typeName, registry = new ClassRegistry()) {
  const descriptors = extractDescriptors(typeBundle, objectGraph, typeName);

  const scalars = extractScalars(objectGraph, descriptors);
  const objects = extractObjects(typeBundle, objectGraph, descriptors, registry);
  const connections = extractConnections(typeBundle, objectGraph, descriptors, registry);

  const model = new (registry.classForType(typeName))(scalars);

  Object.assign(model, objects, connections);

  return model;

}
