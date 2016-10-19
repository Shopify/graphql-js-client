
const Collection = {
  "name": "Collection",
  "kind": "OBJECT",
  "scalars": {
    "handle": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "id": {
      "type": "ID",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "title": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "updatedAt": {
      "type": "DateTime",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    }
  },
  "objects": {},
  "connections": {
    "products": {
      "type": "ProductConnection",
      "kind": "OBJECT",
      "isList": false,
      "args": ["first", "after", "reverse"]
    }
  },
  "implementsNode": true
};
export default Object.freeze(Collection);