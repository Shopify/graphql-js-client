import join from './join';
import schemaForType from './schema-for-type';
import formatArgs from './format-args';
import noop from './noop';

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
    this.args = args;
    this.selectionSet = selectionSet;
  }
  toString() {
    return `${this.name}${formatArgs(this.args)}${this.selectionSet.toString()}`;
  }
}

class InlineFragment {
  constructor(typeName, selectionSet) {
    this.typeName = typeName;
    this.selectionSet = selectionSet;
  }
  toString() {
    return `... on ${this.typeName}${this.selectionSet.toString()}`;
  }
}


export default class SelectionSet {
  constructor(typeBundle, type) {
    if (typeof type === 'string') {
      this.typeSchema = schemaForType(typeBundle, type);
    } else {
      this.typeSchema = type;
    }
    this.typeBundle = typeBundle;
    this.selections = [];
  }

  hasSelectionWithName(name) {
    return this.selections.some((field) => {
      return field.name === name;
    });
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
  add(selection, ...rest) {
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

      selectionSet = new SelectionSet(this.typeBundle, fieldBaseType);
      callback(selectionSet);
    }

    return new Field(name, args, selectionSet);
  }

  inlineFragmentOn(typeName, callbackOrSelectionSet = noop) {
    let selectionSet;

    if (SelectionSet.prototype.isPrototypeOf(callbackOrSelectionSet)) {
      selectionSet = callbackOrSelectionSet;
    } else {
      selectionSet = new SelectionSet(this.typeBundle, schemaForType(this.typeBundle, typeName));

      callbackOrSelectionSet(selectionSet);
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
