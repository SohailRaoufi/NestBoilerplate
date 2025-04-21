import { BadRequestException } from '@nestjs/common';

export const filterOperators = [
  '$eq',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$ne',
  '$in',
  '$nin',
  '$like',
  '$ilike',
  '$btw',
  '$exists',
] as const;

export type FilterOperator = (typeof filterOperators)[number];

/**
 * Transforms flat query parameters with operators into a nested object usable by the ORM.
 */
export function transformFilterQueryParams(
  queryParams: Record<string, string>,
): Record<string, any> {
  const operatorsMap: Record<string, string> = {
    $eq: '$eq',
    $gt: '$gt',
    $gte: '$gte',
    $lt: '$lt',
    $lte: '$lte',
    $ne: '$ne',
    $in: '$in',
    $nin: '$nin',
    $like: '$like',
    $ilike: '$ilike',
    $btw: 'between',
    $exists: '$exists',
  };

  try {
    const parseValue = (value: string): any => {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      // If comma-separated and not quoted, treat as array
      if (
        value.includes(',') &&
        !value.startsWith('"') &&
        !value.endsWith('"')
      ) {
        return value.split(',').map((v) => (isNaN(Number(v)) ? v : Number(v)));
      }
      return isNaN(Number(value)) ? value : Number(value);
    };

    const result: Record<string, any> = {};

    for (const [key, rawVal] of Object.entries(queryParams)) {
      const conditions = rawVal.includes(';') ? rawVal.split(';') : [rawVal];
      const keyParts = key.split('.');

      let current = result;
      for (let i = 0; i < keyParts.length; i++) {
        const part = keyParts[i];

        if (i === keyParts.length - 1) {
          for (const condition of conditions) {
            const [operator, rawValue] = condition.includes(':')
              ? condition.split(':')
              : ['$eq', condition];
            const ormOperator = operatorsMap[operator];

            if (!ormOperator) {
              console.warn(`Unsupported operator: ${operator}`);
              continue;
            }

            if (ormOperator === 'between') {
              const [start, end] = parseValue(rawValue);
              current[part] = {
                ...(current[part] || {}),
                $gte: current[part]?.$gte
                  ? Math.min(current[part].$gte, start)
                  : start,
                $lte: current[part]?.$lte
                  ? Math.max(current[part].$lte, end)
                  : end,
              };
            } else {
              const parsedValue = parseValue(rawValue);
              if (ormOperator === '$in' || ormOperator === '$nin') {
                current[part] = {
                  ...(current[part] || {}),
                  [ormOperator]: Array.isArray(parsedValue)
                    ? parsedValue
                    : [parsedValue],
                };
              } else {
                current[part] = {
                  ...(current[part] || {}),
                  [ormOperator]: parsedValue,
                };
              }
            }
          }
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      }
    }

    return result;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new BadRequestException('Request Not Found.');
  }
}

/**
 * Recursively merges filter operators from defaults and query. If arrays of values exist, they are combined.
 */
export function mergeFilterOperators(
  defaults: Record<string, any>,
  query: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = { ...defaults };

  for (const key in query) {
    if (['$and', '$or', '$not'].includes(key)) {
      // Preserve default for logical operators
      result[key] = defaults[key];
      continue;
    }

    const defaultVal = result[key];
    const queryVal = query[key];

    if (isPlainObject(queryVal) && isPlainObject(defaultVal)) {
      result[key] = mergeFilterOperators(defaultVal, queryVal);
    } else if (Array.isArray(queryVal) && Array.isArray(defaultVal)) {
      // Combine arrays (e.g. for $in, $nin)
      result[key] = Array.from(new Set([...defaultVal, ...queryVal]));
    } else {
      result[key] = queryVal;
    }
  }

  return result;
}

/**
 * Recursively filters the client query based on allowed filter rules.
 * Only includes fields/operators defined in `filterable`.
 */
export function sanitizeFilterQuery(
  filterable: Record<string, any>,
  clientQuery: Record<string, any>,
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [field, value] of Object.entries(clientQuery)) {
    if (!(field in filterable)) continue;

    const allowedOperators = filterable[field];

    if (
      typeof allowedOperators === 'string' ||
      Array.isArray(allowedOperators)
    ) {
      // AllowedOperators define which operators we can use
      // If value is an object with operators
      if (isPlainObject(value)) {
        const filteredValue: Record<string, any> = {};
        for (const [op, opVal] of Object.entries(value)) {
          if (isOperatorAllowed(op, allowedOperators)) {
            filteredValue[op] = opVal;
          }
        }

        if (Object.keys(filteredValue).length > 0) {
          sanitized[field] = filteredValue;
        }
      } else {
        // If the value is not an object, treat as $eq if allowed
        const eqAllowed = isOperatorAllowed('$eq', allowedOperators);
        if (eqAllowed) {
          sanitized[field] = { $eq: value };
        }
      }
    } else if (isPlainObject(allowedOperators) && isPlainObject(value)) {
      // Nested fields
      const nestedSanitized = sanitizeFilterQuery(allowedOperators, value);
      if (Object.keys(nestedSanitized).length > 0) {
        sanitized[field] = nestedSanitized;
      }
    }
  }

  return sanitized;
}

function isOperatorAllowed(
  operator: string,
  allowedOperators: string | string[],
): boolean {
  if (typeof allowedOperators === 'string') {
    return operator === allowedOperators;
  } else if (Array.isArray(allowedOperators)) {
    return allowedOperators.includes(operator);
  }
  return false;
}

/**
 * Converts a flat object with dot-separated keys into a nested object structure.
 */
export function unFlattenObject<T extends Record<string, any>>(
  obj: T,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const keys = key.split('.');
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i < keys.length - 1) {
        if (!isPlainObject(current[k])) {
          current[k] = {};
        }
        current = current[k];
      } else {
        current[k] = value;
      }
    }
  }
  return result;
}

/**
 * Sanitizes a nested sort object against a list of allowed sortable fields.
 * Only includes keys present in `sortable`.
 */
export function sanitizeSortObject(
  sortObject: Record<string, any>,
  sortable: string[],
): Record<string, any> {
  const result: Record<string, any> = {};

  function helper(obj: Record<string, any>, currentPath: string[] = []) {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const newPath = [...currentPath, key];
      const dotPath = newPath.join('.');

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const childIsSortable = sortable.some((s) =>
          s.startsWith(dotPath + '.'),
        );
        if (childIsSortable) {
          const nested = helper(value, newPath);
          if (Object.keys(nested).length > 0) {
            // Ensure path in result exists
            let target = result;
            for (const p of currentPath) {
              target[p] = target[p] || {};
              target = target[p];
            }
            target[key] = nested;
          }
        }
      } else {
        // It's a leaf
        if (sortable.includes(dotPath)) {
          let target = result;
          for (const p of currentPath) {
            target[p] = target[p] || {};
            target = target[p];
          }
          target[key] = value;
        }
      }
    }
    return getAtPath(result, currentPath);
  }

  helper(sortObject);
  return result;
}

function getAtPath(obj: Record<string, any>, path: string[]) {
  let current = obj;
  for (const p of path) {
    current[p] = current[p] || {};
    current = current[p];
  }
  return current;
}

/**
 * Deep merges two sort objects. Client values override default values.
 */
export function mergeSortObjects(
  defaultObj: Record<string, any>,
  clientObj: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = { ...defaultObj };

  for (const key of Object.keys(clientObj)) {
    const defaultVal = defaultObj[key];
    const clientVal = clientObj[key];

    if (isPlainObject(defaultVal) && isPlainObject(clientVal)) {
      result[key] = mergeSortObjects(defaultVal, clientVal);
    } else {
      result[key] = clientVal;
    }
  }

  return result;
}

/**
 * Checks if a value is a plain object.
 *
 * @param val - The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
function isPlainObject(val: any): val is Record<string, any> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}
