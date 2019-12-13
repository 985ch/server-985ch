// 管理资源数据
'use strict';

module.exports = app => {
  const db = app.resDB;
  class MyService extends app.Service {
    // 列出所有未指定归属的资源
    async listUnknownRes() {
      return await db.Resources.simpleFind({ titleid: -1, valid: 1 });
    }
    // 更新资源状态
    async updateResource(source, path, info) {
      const valid = info === '' ? 0 : 1;
      return await db.Resources.upsert({ source, path, info, valid });
    }
  }
  return MyService;
};
