
const QueryRoot = {
  "name": "QueryRoot",
  "kind": "OBJECT",
  "scalars": {},
  "objects": {
    "collection": {
      "type": "Collection",
      "kind": "OBJECT",
      "isList": false,
      "args": ["id"]
    },
    "product": {
      "type": "Product",
      "kind": "OBJECT",
      "isList": false,
      "args": ["id"]
    },
    "shop": {
      "type": "Shop",
      "kind": "OBJECT",
      "isList": false,
      "args": []
    }
  },
  "connections": {},
  "implementsNode": false
};
export default Object.freeze(QueryRoot);