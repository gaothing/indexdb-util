export {
  canUse,
  isObject,
  isString,
  isArray,
  getSpace
}
from './utils'

/**
 * 创建一个IndexedDB数据库实例，并根据提供的storeList配置数据库的object stores。
 * 
 * @param {Object} config - 函数配置对象
 * @param {string} config.name - 数据库的名称
 * @param {number} config.version - 数据库的版本，默认为1
 * @param {Array} config.storeList - object stores的配置列表，默认为空数组
 * @returns {Promise} - 返回一个Promise对象，成功时解析为数据库实例，失败时拒绝并返回错误信息
 */
export const createIndexDB = ({
  name,
  version = 1,
  storeList = [],
}) => {
  return new Promise((resolve, reject) => {
    if (!canUse()) {
      reject(new Error('当前浏览器不支持IndexedDB'))
      return
    }
    const currentIndexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    const request = currentIndexedDB.open(name, version)
    request.onupgradeneeded = function (event) {
      const database = event.target.result;
      if (isObject(storeList)) {
        storeList = [storeList]
      }
      storeList.forEach((curStore) => {
        const {
          name: storeName,
          keyPath = 'id',
          autoIncrement = true,
          indexs = []
        } = curStore
        if (!database.objectStoreNames.contains(storeName)) {
          const objectStore = database.createObjectStore(storeName, {
            keyPath,
            autoIncrement
          });
          if (isArray(indexs) && indexs.length) {
            indexs.forEach((item) => {
              console.log({
                item
              })
              if (isObject(item) && item.key) {
                objectStore.createIndex(item.key, item.key, {
                  unique: !!item.unique
                });
              } else if (isString(item)) {
                objectStore.createIndex(item, item, {
                  unique: false
                });
              }
            })
          }
        }
      })
    };
    request.onsuccess = function (event) {
      resolve(_withMethods(event.target.result, storeList));
    };

    request.onerror = function (event) {
      reject(`[indexDB]  ${event.target.error}`);
    };
  })
}

/**
 * 为给定的实例添加具有特定存储名称的方法。
 * 这些方法提供对存储中数据的CRUD（创建、读取、更新、删除）操作。
 * 
 * @param {Object} instance - KeyBObjectStore实例，用于操作特定存储。
 * @param {string} storeList - 存储的名称(表名)
 * @returns {Object} 返回一个对象，包含getAll、getByKey、add、deleteByKey和updateByKey等方法。
 */
function _withMethods(instance, storeList) {
  const defaultStoreName = storeList[0].name
  const defaultKeyPath = storeList[0].keyPath
  return {
    /**
     * 获取当前数据库下的表名称集合
     * 
     * @returns {ObjectStoreNameList} 返回一个对象存储名称的列表
     */
    getStoreNames() {
      return instance.objectStoreNames
    },
    /**
     * 获取数据库的版本号
     * @returns {string} 返回数据库的版本号
     */
    getVersion() {
      return instance.version
    },
    /**
     * 根据属性值异步获取数据，该属性必须在初创建或版本升级时在 indexs中传入。
     * 该方法用于在给定对象中查找并返回与指定属性值匹配的数据。
     * 它首先验证对象是否为有效对象，然后获取对象的所有属性名，
     * 并从这些属性中选择第一个作为查询的属性。最后，它通过此属性的值在存储中进行查询。
     * 
     * @param {Object} obj - 要查询的对象，必须是一个有效对象。
     * @param {String} storeName - 要查询的表名
     * @returns {Promise} - 返回一个Promise，解析为查询结果，如果没有找到匹配的数据或输入无效，则Promise解析为undefined。
     */
    getByAttr: async (obj, storeName = defaultStoreName) => {
      if (!isObject(obj)) {
        return
      }
      const attrs = Object.getOwnPropertyNames(obj)
      if (!attrs.length) {
        return
      }
      const attr = attrs[0]
      return await _transaction(instance, storeList, storeName, (store) => {
        const index = store.index(attr)
        return index.get(obj[attr])
      }, 'readonly')

    },

    /**
     * 异步插入数据到指定的存储中。
     * 
     * 此函数用于将给定的数据插入到指定的存储中。它支持插入单个对象或对象数组。
     * 使用了事务处理来确保数据操作的原子性。
     * 
     * @param {Object|Object[]} data - 需要插入的数据，可以是单个对象或对象数组。
     * @param {String} storeName - 要查询的表名
     * @returns {Promise} 返回一个Promise对象，表示数据插入操作的完成。
     */
    insert: async (data, storeName = defaultStoreName) => {
      return await _transaction(instance, storeList, storeName, (store) => {
        let ret;
        if (Array.isArray(data)) {
          data.forEach((item) => ret = store.add(item))
        } else {
          ret = store.add(data)
        }
        return ret
      })
    },
    /**
     * 从存储中获取所有数据。
     * 
     * @param {String} storeName - 要查询的表名
     * @returns {Promise<Array>} 返回一个包含所有数据的数组。
     */
    getAll: async (storeName = defaultStoreName) => {
      return await _transaction(instance, storeList, storeName, (store) => store.getAll(), 'readonly')
    },

    /**
     * 根据Key从存储中获取数据。
     * 
     * @param {string|number} key - 需要获取的数据的Key。
     * @param {String} storeName - 要查询的表名
     * @returns {Promise<Object|null>} 返回对应key的数据对象或null（如果找不到）。
     */
    getByKey: async (key, storeName = defaultStoreName) => {
      return await _transaction(instance, storeList, storeName, (store) => store.get(key), 'readonly')
    },

    /**
     * 向存储中添加新数据。
     * 
     * @param {Object} data - 需要添加到存储中的数据对象。
     * @param {String} storeName - 要查询的表名
     * @returns {Promise} 返回一个Promise，表示数据添加操作已完成。
     */
    add: async (data, storeName = defaultStoreName) =>
      await _transaction(instance, storeList, storeName, (store) => store.add(data)),

    /**
     * 根据Key从存储中删除数据。
     * 如果未提供Key，则不执行任何操作。
     * 
     * @param {string|number} Key - 需要删除的数据的Key。
     * @param {String} storeName - 要查询的表名
     * @returns {Promise} 返回一个Promise，表示数据删除操作已完成。
     */
    deleteByKey: async (key, storeName = defaultStoreName) => {
      if (!key) return
      return await _transaction(instance, storeList, storeName, (store) => store.delete(key))
    },

    /**
     * 根据Key更新存储中的数据。
     * 如果提供的数据对象没有Key，则不执行任何操作。
     * 
     * @param {Object} data - 需要更新的数据对象。它应该包含要更新的Key和新数据。
     * @param {String} storeName - 要查询的表名
     * @returns {Promise} 返回一个Promise，表示数据更新操作已完成。
     */
    updateByKey: async (data, storeName) => {
      let keyPath = defaultKeyPath;
      if (storeName) {
        const current = storeList.find(item => item.name == storeName)
        keyPath = current && current.keyPath || defaultKeyPath
      } else {
        storeName = defaultStoreName
      }
      if (!data[keyPath]) {
        return
      }
      const result = await _transaction(instance, storeList, storeName, (store) => store.get(data[keyPath]))
      return await _transaction(instance, storeList, storeName, (store) => store.put(Object.assign({}, result, data)))
    },
    /**
     * 异步清除指定存储空间的数据。
     * 
     * @param {string} storeName - 需要被清除数据的存储空间名称。如果未提供，则使用默认存储空间名称。
     * @returns {Promise<void>} - 表示清除操作完成的Promise对象。
     */
    clear: async (storeName = defaultStoreName) =>
      await _transaction(instance, storeList, storeName, (store) => store.clear())
  }

}
/**
 * 创建一个事务来执行对特定对象存储的操作。
 * @param {Object} instance - KeyBDatabase实例，用于创建事务。
 * @param {string} storeName - 对象存储的名称，事务将操作这个存储。
 * @param {Function} callback - 在事务中执行的操作，接收对象存储作为参数。
 * @returns {Promise} - 表示操作完成的Promise对象，成功时解决为操作结果，失败时拒绝。
 */
function _transaction(instance, storeList, storeName, callback, operation = 'readwrite') {
  // 初始化一个读写事务
  let transaction = instance.transaction([storeName], operation);
  // 获取指定名称的对象存储
  let store = transaction.objectStore(storeName);
  // 返回一个Promise，用于处理操作的成功或失败
  return new Promise((resolve, reject) => {
    // 执行传入的回调函数，进行具体的操作
    let request = callback(store);
    // 设置错误处理，触发时拒绝Promise
    request.onerror = function (event) {
      reject(`[indexDB] ${event.target.error}`)
    };
    // 设置成功处理，触发时解决Promise，并传递结果
    request.onsuccess = function (event) {
      resolve(event.target.result)
    };
    // 事务完成时的处理，关闭数据库连接
    // 提交事务  
    transaction.oncomplete = function (event) {
      // console.log('transaction complete')
      // instance.close()
    };
  })
}