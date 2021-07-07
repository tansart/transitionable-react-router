export function normalisePath(path = '') {
  return path.replace('//', '/');
}

export function last(arr = []) {
  return arr[arr.length - 1];
}

export function noop() {}
