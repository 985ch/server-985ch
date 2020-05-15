// 相关成员管理
'use strict';

module.exports = app => {
  const db = app.psiDB;
  class MyService extends app.Service {
    async getData() {
      return await db.Member.simpleFind();
    }
    async upsert(fields) {
      if (!fields.id) {
        delete fields.id;
        return await db.Member.create(fields);
      }
      return await db.Member.update(fields, { where: { id: fields.id } });
    }
  }
  return MyService;
};
