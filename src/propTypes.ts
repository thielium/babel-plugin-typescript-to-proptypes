import { types as t } from '@babel/core';
import { ConvertState } from './types';

export function createPropTypesObject(
  propTypes: t.ObjectProperty[],
  state: ConvertState,
): t.CallExpression | t.ObjectExpression {
  const object = t.objectExpression(propTypes);

  // Wrap with forbid
  return state.options.forbidExtraProps
    ? t.callExpression(t.identifier(state.airbnbPropTypes.forbidImport), [object])
    : object;
}

export function mergePropTypes(
  expr: any,
  propTypes: t.ObjectProperty[],
  state: ConvertState,
  wrapForbid: boolean = true,
): t.CallExpression | t.ObjectExpression {
  if (t.isCallExpression(expr)) {
    if (t.isIdentifier(expr.callee, { name: 'forbidExtraProps' })) {
      expr.arguments.forEach((arg, index) => {
        expr.arguments[index] = mergePropTypes(arg, propTypes, state, false);
      });
    }

    return expr;
  }

  if (!t.isObjectExpression(expr)) {
    return expr;
  }

  const { properties } = expr;
  const existingProps: { [key: string]: boolean } = {};

  // Extract existing props so that we don't duplicate
  properties.forEach(property => {
    if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
      existingProps[property.key.name] = true;
    }
  });

  // Add to the beginning of the array so existing/custom prop types aren't overwritten
  propTypes.forEach(propType => {
    if (t.isIdentifier(propType.key) && !existingProps[propType.key.name]) {
      properties.unshift(propType);
    }
  });

  // Wrap with forbid
  if (wrapForbid && state.options.forbidExtraProps) {
    return t.callExpression(t.identifier(state.airbnbPropTypes.forbidImport), [expr]);
  }

  return expr;
}
