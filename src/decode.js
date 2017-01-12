/* eslint-disable no-warning-comments */
import ClassRegistry from './class-registry';
import {Field} from './selection-set';
import Query from './query';
import isObject from './is-object';
import isNodeContext from './is-node-context';
import transformConnections from './transform-connection';

class DecodingContext {
  constructor(selection, responseData, parent = null) {
    this.selection = selection;
    this.responseData = responseData;
    this.parent = parent;
    Object.freeze(this);
  }

  contextForObjectProperty(responseKey) {
    const nestedSelections = this.selection.selectionSet.selectionsByResponseKey[responseKey];
    const nextSelection = nestedSelections && nestedSelections[0];
    const nextContext = new DecodingContext(nextSelection, this.responseData[responseKey], this);

    if (!nextSelection) {
      throw new Error(`Unexpected response key "${responseKey}", not found in selection set: ${this.selection.selectionSet}`);
    }

    if (nextSelection instanceof Field) {
      return nextContext;
    } else {
      return nextContext.contextForObjectProperty(responseKey);
    }
  }

  contextForArrayItem(item) {
    return new DecodingContext(this.selection, item, this.parent);
  }
}

function decodeArrayItems(context, transformers) {
  return context.responseData.map((item) => decodeContext(context.contextForArrayItem(item), transformers));
}

function decodeObjectValues(context, transformers) {
  return Object.keys(context.responseData).reduce((acc, responseKey) => {
    acc[responseKey] = decodeContext(context.contextForObjectProperty(responseKey), transformers);

    return acc;
  }, {});
}

function runTransformers(transformers, context, value) {
  return transformers.reduce((acc, transformer) => {
    return transformer(context, acc);
  }, value);
}

function decodeContext(context, transformers) {
  let value = context.responseData;

  if (Array.isArray(value)) {
    value = decodeArrayItems(context, transformers);
  } else if (isObject(value)) {
    value = decodeObjectValues(context, transformers);
  }

  return runTransformers(transformers, context, value);
}

function generateRefetchQueries(context, value) {
  if (isNodeContext(context)) {
    value.refetchQuery = function() {
      return new Query(context.selection.selectionSet.typeBundle, (root) => {
        root.add('node', {args: {id: context.responseData.id}}, (node) => {
          node.addInlineFragmentOn(context.selection.selectionSet.typeSchema.name, context.selection.selectionSet);
        });
      });
    };
  }

  return value;
}

function transformPojosToClassesWithRegistry(classRegistry) {
  return function transformPojosToClasses(context, value) {
    if (isObject(value)) {
      const Klass = classRegistry.classForType(context.selection.selectionSet.typeSchema.name);

      return new Klass(value);
    } else {
      return value;
    }
  };
}

function defaultTransformers({classRegistry = new ClassRegistry()}) {
  return [
    generateRefetchQueries,
    transformConnections,
    transformPojosToClassesWithRegistry(classRegistry)
  ];
}

export default function decode(selection, responseData, options = {}) {
  const transformers = options.transformers || defaultTransformers(options);
  const context = new DecodingContext(selection, responseData);

  return decodeContext(context, transformers);
}
