// 缓存数据统一管理
'use strict';

module.exports = app => {
  const cacheMem = app.cache9.get('mem');
  const db = app.resDB;
  class MyService extends app.Service {
    // 获取作品类型列表
    async getTitleTypes() {
      const types = await cacheMem.get('titletype', async () => {
        return await db.Titletype.findAll({
          order: [[ 'id', 'asc' ]],
          raw: true,
        });
      });
      return types;
    }
  }
  return MyService;
};
