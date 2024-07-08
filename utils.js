export const canUse = () => window.indexedDB


const toString = Object.prototype.toString;

export const is = (val, type) => {
  return toString.call(val) === `[object ${type}]`;
}

export const isObject = (val) => {
  return val !== null && is(val, 'Object');
}

export function isString(val) {
  return is(val, 'String');
}
export function isArray(val) {
  return val && Array.isArray(val);
}

/**
 * 异步函数getSpace用于获取浏览器存储空间的估计信息。
 * 它返回一个对象，包含已使用的存储空间、可用的存储空间以及存储空间的单位。
 * 如果浏览器不支持navigator.storage.estimate方法，则会打印警告。
 * 
 * @returns {Promise<object>} 包含存储空间信息的Promise对象，如果浏览器不支持，则Promise解析为空对象。
 */
export const getSpace = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const {
      quota,
      usage
    } = await navigator.storage.estimate();
    const remaining = quota - usage;
    return {
      quota: quota / 1024,
      usage: usage / 1024,
      remaining: remaining / 1024,
      unit: 'kb'
    }
  } else {
    console.warn('当前浏览器不支持该方法');
  }
}