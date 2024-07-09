# @gaothing/indexdb-util


该工程主要是对浏览器中缓存`indexDB`的 API 进行封装，让不熟悉其 api 的同学可以快速上手！

## indexDB的介绍

IndexDB是一个基于JavaScript的面向对象数据库，它是HTML5中新增的一个功能，用于在浏览器中提供强大的数据存储与查询能力。IndexDB 的主要优势就是其存储空间通常较大，例如IE的储存上限是250MB，Chrome和Opera则是剩余空间的某个百分比，而Firefox则没有明确的上限。

## 安装

```

//npm 

npm install @gaothing/indexdb-util

//pnpm 

pnpm install  @gaothing/indexdb-util

//yarn

yarn add  @gaothing/indexdb-util

```

## API 介绍

  ### 引入
    直接引入使用的方法有三个： 


      
 ```js
  import { createIndexDB ,canUse ,getSpace} from '@gaothing/indexdb-util'

 ```

   - `canUse` 

    * 检查当前浏览器环境是否支持IndexedDB

   - `getSpace`

    * 异步函数getSpace用于获取浏览器存储空间的估计信息。
    * 它返回一个对象，包含已使用的存储空间、可用的存储空间以及存储空间的单位。
    * 如果浏览器不支持navigator.storage.estimate方法，则会打印警告。
    * 
    * @returns {Promise<object>} 包含存储空间信息的Promise对象，如果浏览器不支持，则Promise解析为空对象。


  ```js

  const space= await getSpace()
  //返回值示例：
  {
  "quota":146886079.19921875,//存储空间配额
  "usage":843.9599609375,//已使用的存储空间
  "remaining":146885235.2392578,//剩余存储空间
  "unit":"kb"//单位
  }

  ```

  - `createIndexDB ` 创建 IndexDB实例 



  ### 创建 IndexDB实例

   通过`createIndexDB`函数直接返回其实例的方法
   



  
 ```js
  import { createIndexDB } from '@gaothing/indexdb-util'
  const {
    getStoreNames,
    getVersion，
    getByAttr，
    add,
    insert,
    getAll,
    updateByKey,
    deleteByKey,
    getByKey,
    clear
    }=await createIndexDB({
     name:'questionnaire', //数据库的名称。
    version:1, //数据库的版本号。默认为1。 数据库的版本号。用于检测和升级数据库。
    storeList:[{//要创建存储对象集合。在数据库中创建或访问对应的对象存储。
      name:'list',//存储对象的名称(表名)。在数据库中创建或访问对应的对象存储。
      keyPath:'id',//存储对象的键路径。默认为'id'。
      autoIncrement:false,//是否自动为存储对象生成唯一递增的键。默认为true。
      indexs:[{key:'name',unique:true},'age']//索引列表,对象中key为索引名称，unique为是否唯一索引:true表示唯一索引  ,字符串为索引名称，unique默认 false
    },{
      name:'kaka'
    }]
  })


 ```


> **getStoreNames**

  * 获取当前数据库下的表名称集合
  * 
  * @returns {ObjectStoreNameList} 返回一个对象存储名称的列表

  ```js
  const list= getStoreNames()
  ```
> **getVersion**

  * 同步返回
 * 获取数据库的版本号
 * @returns {number} 返回数据库的版本号

> **getByAttr**

 * 根据属性值异步获取数据，该属性必须在初创建或版本升级时在 indexs中传入。
* 该方法用于在给定对象中查找并返回与指定属性值匹配的数据。
* 它首先验证对象是否为有效对象，然后获取对象的所有属性名，
* 最后，它通过此属性的值在存储中进行查询。如有重复，返回值最小的那一个
* 
* @param {Object} obj - 要查询的对象，必须是一个有效对象。
* @param {String} storeName - 要查询的表名，默认创建的时候的第一个
* @returns {Promise} - 返回一个Promise，解析为查询结果，如果没有找到匹配的


```js
const res =  await getByAttr({name:'xxx'})
```

> **add**
   * 向存储中添加新数据(单条数据)
  * @param {Object} data - 需要添加到存储中的数据对象。
  * @param {String} storeName - 要查询的表名
  * @returns {Promise} 返回一个Promise，表示数据添加操作已完成。

 ```js
  await add({id:1,name:'xxx',...})
  ```

> **insert**

     * 异步插入数据到指定的存储中。
     * 此函数用于将给定的数据插入到指定的存储中。它支持插入单个对象或对象数组。
     * 使用了事务处理来确保数据操作的原子性。
     * 
     * @param {Object|Object[]} data - 需要插入的数据，可以是单个对象或对象数组。
      * @param {String} storeName - 要查询的表名，默认创建的时候的第一个
     * @returns {Promise} 返回一个Promise对象，表示数据插入操作的完成。
    

  ```js
  //插入对象
  await insert({id:1,name:'xxx',...})
  //多条插入
  await insert([{id:1,name:'xxx'},{id:2,name:'xxx2'}])
  ```

 > **getAll**

    * 从存储中获取所有数据。
    * @param {String} storeName - 要查询的表名，默认创建的时候的第一个
    * @returns {Promise<Array>} 返回一个包含所有数据的数组。
    
  ```js

  const list =  await getAll()

  ```
> **getByKey**

     * 根据ID从存储中获取数据。
     * @param {string|number} key - 需要获取的数据的key的值。key 为创建时传入的 keyPath,没有传则默认为`id`
     * @param {String} storeName - 要查询的表名，默认创建的时候的第一个
     * @returns {Promise<Object|null>} 返回对应ID的数据对象或null（如果找不到）

  ```js

  const res =  await getById(1)

  ```
> **deleteByKey**

  * 根据ID从存储中删除数据。
  * 如果未提供ID，则不执行任何操作。
  * @param {string|number} key - 需要获取的数据的key的值。key 为创建时传入的 keyPath,没有传则默认为`id`
  * @param {String} storeName - 要查询的表名，默认创建的时候的第一个
  * @returns {Promise} 返回一个Promise，表示数据删除操作已完成。

```js

const res =  await deleteById(1)

```

> **updateByKey**

     * 根据ID更新存储中的数据。
     * @param {string|number} key - 需要获取的数据的key的值。key 为创建时传入的 keyPath,没有传则默认为`id`
     * @param {Object} data - 需要更新的数据对象。它应该包含要更新的ID和新数据。
     * @returns {Promise} 返回一个Promise，表示数据更新操作已完成。

```js

const res =  await updateById({id:1,name:'updatename'})

```

> **clear**

  * 清除所有数据

  ```js

  await clear()

  ```