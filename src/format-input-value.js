import join from './join';
import {VariableDefinition} from './variable';
import {Enum} from './enum';
import formatObject from './format-object';
import check from './check-js-type';

export default function formatInputValue(value) {
  let formattedValue;

  if (check.is(value, VariableDefinition)) {
    formattedValue = value.toInputValueString();
  } else if (check.is(value, Enum)) {
    formattedValue = String(value);
  } else if (check.isArray(value)) {
    formattedValue = `[${join(...value.map(formatInputValue))}]`;
  } else if (check.isObject(value)) {
    formattedValue = formatObject(value, '{', '}');
  } else {
    formattedValue = JSON.stringify(value);
  }

  return formattedValue;
}
