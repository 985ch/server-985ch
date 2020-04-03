// 管理资源数据
'use strict';

module.exports = app => {
  const db = app.resDB;
  class MyService extends app.Service {
    // 列出所有未指定归属的资源
    async listUnknownRes() {
      return await db.Resources.simpleFind({ bind: 0, valid: 1 });
    }
    // 根据关键字查找资源
    async find(keyword) {
      if (!keyword || keyword === '') {
        return await db.Resources.simpleFind({ valid: 1 });
      }
      return await db.Resources.simpleFind({ path: { [db.Sequelize.Op.like]: `%${keyword}%` }, valid: 1 });
    }
    // 获取资源数据
    async getData(id) {
      return await db.Resources.simpleFindOne({ id }, [ 'id', 'source', 'path', 'bind', 'info', 'valid', 'updatetime' ]);
    }
    // 更新资源状态
    async updateResource(source, path, info) {
      const valid = info === '' ? 0 : 1;
      return await db.Resources.upsert({ source, path, info, valid });
    }
    // 绑定
    async bind(values) {
      await db.Resources.increment({ bind: 1 }, { where: { id: values.resid } });
      return await db.Titleres.create(values);
    }
    // 解绑
    async unbind(id) {
      const found = await db.Titleres.simpleFindOne({ id });
      if (found) {
        await db.Resources.decrement({ bind: 1 }, { where: { id: found.resid } });
      }
      return await db.Titleres.destroy({ where: { id } });
    }
  }
  return MyService;
};
