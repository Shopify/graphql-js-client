import deepFreezeCopyExcept from './deep-freeze-copy-except';
import join from './join';
import schemaForType from './schema-for-type';
import formatArgs from './format-args';
import noop from './noop';
import {isVariable} from './variable';
import typeProfiler from './type-profiler';

function parseFieldCreationArgs(creationArgs) {
  let callback = noop;
  let args = {};
  let selectionSet = null;

  if (creationArgs.length === 2) {
    if (typeof creationArgs[1] === 'function') {
      [args, callback] = creationArgs;
    } else {
      [args, selectionSet] = creationArgs;
    }
  } else if (creationArgs.length === 1) {
    // SelectionSet is defined before this function is called since it's
    // called by SelectionSet
    // eslint-disable-next-line no-use-before-define
    if (SelectionSet.prototype.isPrototypeOf(creationArgs[0])) {
      selectionSet = creationArgs[0];
    } else if (typeof creationArgs[0] === 'function') {
      callback = creationArgs[0];
    } else {
      args = creationArgs[0];
    }
  }

  return {args, selectionSet, callback};
}

export class Field {
  constructor(name, args, selectionSet) {
    this.name = name;
    this.args = deepFreezeCopyExcept(isVariable, args);
    this.selectionSet = selectionSet;
    Object.freeze(this);
  }
  toString() {
    return `${this.name}${formatArgs(this.args)}${this.selectionSet.toString()}`;
  }
}

class InlineFragment {
  constructor(typeName, selectionSet) {
    this.typeName = typeName;
    this.selectionSet = selectionSet;
    Object.freeze(this);
  }
  toString() {
    return `... on ${this.typeName}${this.selectionSet.toString()}`;
  }
}

function selectionsHaveIdField(selections) {
  return selections.some((fieldOrFragment) => {
    if (Field.prototype.isPrototypeOf(fieldOrFragment)) {
      return fieldOrFragment.name === 'id';
    } else if (InlineFragment.prototype.isPrototypeOf(fieldOrFragment) && fieldOrFragment.selectionSet.typeSchema.implementsNode) {
      return selectionsHaveIdField(fieldOrFragment.selectionSet.selections);
    }

    return false;
  });
}

export default class SelectionSet {
  constructor(typeBundle, type, builderFunction) {

    if (typeof type === 'string') {
      this.typeSchema = schemaForType(typeBundle, type);
    } else {
      this.typeSchema = type;
    }

    typeProfiler(this.typeSchema.name);

    this.typeBundle = typeBundle;
    this.selections = [];
    if (builderFunction) {
      // eslint-disable-next-line no-use-before-define
      builderFunction(new SelectionSetBuilder(this.typeBundle, this.typeSchema, this.selections));
    }

    if (this.typeSchema.implementsNode || this.typeSchema.name === 'Node') {
      if (!selectionsHaveIdField(this.selections)) {
        this.selections.unshift(new Field('id', {}, new SelectionSet(typeBundle, 'ID')));
      }
    }
    Object.freeze(this.selections);
    Object.freeze(this);
  }

  toString() {
    if (this.typeSchema.kind === 'SCALAR') {
      return '';
    } else {
      const commaDelimitedSelections = join(this.selections.map((selection) => {
        return selection.toString();
      }));

      return ` { ${commaDelimitedSelections} }`;
    }
  }
}

class SelectionSetBuilder {
  constructor(typeBundle, typeSchema, selections) {
    this.typeBundle = typeBundle;
    this.typeSchema = typeSchema;
    this.selections = selections;
  }

  hasSelectionWithName(name) {
    return this.selections.some((field) => {
      return field.name === name;
    });
  }

  add(selectionOrFieldName, ...rest) {
    let selection = selectionOrFieldName;

    if (Object.prototype.toString.call(selection) === '[object String]') {
      selection = this.field(selection, ...rest);
    }
    if (selection.name && this.hasSelectionWithName(selection.name)) {
      throw new Error(`The field '${selection.name}' has already been added`);
    }
    this.selections.push(selection);
  }

  field(name, ...creationArgs) {
    const parsedArgs = parseFieldCreationArgs(creationArgs);
    const {args, callback} = parsedArgs;
    let {selectionSet} = parsedArgs;

    if (!selectionSet) {
      const fieldBaseType = schemaForType(this.typeBundle, this.typeSchema.fieldBaseTypes[name]);

      selectionSet = new SelectionSet(this.typeBundle, fieldBaseType, callback);
    }

    return new Field(name, args, selectionSet);
  }

  inlineFragmentOn(typeName, builderFunctionOrSelectionSet = noop) {
    let selectionSet;

    if (SelectionSet.prototype.isPrototypeOf(builderFunctionOrSelectionSet)) {
      selectionSet = builderFunctionOrSelectionSet;
    } else {
      selectionSet = new SelectionSet(
        this.typeBundle,
        schemaForType(this.typeBundle, typeName),
        builderFunctionOrSelectionSet
      );
    }

    return new InlineFragment(typeName, selectionSet);
  }

  /**
   * will add a field to be queried to the current query node.
   *
   * @param {String}    name The name of the field to add to the query
   * @param {Object}    [args] Arguments for the field to query
   * @param {Function}  [callback] Callback which will return a new query node for the field added
   */
  addField(name, ...creationArgs) {
    this.add(name, ...creationArgs);
  }

  /**
   * will add a connection to be queried to the current query node.
   *
   * @param {String}    name The name of the connection to add to the query
   * @param {Object}    [args] Arguments for the connection query eg. { first: 10 }
   * @param {Function|SelectionSet}  [callback|selectionSet] Either pass a callback which will return a new
   *                                                         SelectionSet. Or pass an existing SelectionSet.
   */
  addConnection(name, ...creationArgs) {
    const {args, callback, selectionSet} = parseFieldCreationArgs(creationArgs);

    this.add(name, args, (connection) => {
      connection.add('pageInfo', {}, (pageInfo) => {
        pageInfo.add('hasNextPage');
        pageInfo.add('hasPreviousPage');
      });
      connection.add('edges', {}, (edges) => {
        edges.add('cursor');
        edges.addField('node', {}, (selectionSet || callback)); // This is bad. Don't do this
      });
    });
  }

  addInlineFragmentOn(typeName, fieldTypeCb = noop) {
    this.add(this.inlineFragmentOn(typeName, fieldTypeCb));
  }
}
