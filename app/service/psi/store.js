// 进销存系统仓库处理
'use strict';

module.exports = app => {
  const db = app.psiDB;
  class MyService extends app.Service {
    async getData(goodsid) {
      const findJson = {
        order: [
          [ 'goodsid', 'asc' ],
          [ 'storeid', 'asc' ],
        ],
        raw: true,
      };
      if (goodsid) {
        findJson.where = { goodsid };
      }
      return await db.Store.findAll(findJson);
    }
    async setStore(fields) {
      return await db.Store.upsert(fields);
    }
    async getStorages() {
      return await db.Storage.simpleFind();
    }
    async upsertStorage(fields) {
      if (!fields.id) {
        delete fields.id;
        return await db.Storage.create(fields);
      }
      return await db.Storage.update(fields, { where: { id: fields.id } });
    }
  }
  return MyService;
};
