const CustomQueryRoot = {
  "name": "CustomQueryRoot",
  "kind": "OBJECT",
  "fieldBaseTypes": {
    "collection": "Collection",
    "node": "Node",
    "product": "Product",
    "shop": "Shop",
    "arbitraryViewer": "ArbitraryViewer"
  },
  "implementsNode": false
};
Object.freeze(CustomQueryRoot.fieldBaseTypes);
var CustomQueryRoot$1 = Object.freeze(CustomQueryRoot);

const CustomMutation = {
  "name": "CustomMutation",
  "kind": "OBJECT",
  "fieldBaseTypes": {
    "apiCustomerAccessTokenCreate": "ApiCustomerAccessTokenCreatePayload"
  },
  "implementsNode": false,
  "relayInputObjectBaseTypes": {
    "apiCustomerAccessTokenCreate": "ApiCustomerAccessTokenCreateInput"
  }
};
Object.freeze(CustomMutation.fieldBaseTypes);
Object.freeze(CustomMutation.relayInputObjectBaseTypes);
var CustomMutation$1 = Object.freeze(CustomMutation);

const Types  = {
  types: {}
};

Types.types["CustomQueryRoot"] = CustomQueryRoot$1;
Types.types["CustomMutation"] = CustomMutation$1;
Types.queryType = "CustomQueryRoot";
Types.mutationType = "CustomMutation";
Object.freeze(Types.types);
var types = Object.freeze(Types);

export default types;
