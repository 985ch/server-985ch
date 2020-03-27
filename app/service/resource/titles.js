// 管理作品数据
'use strict';

module.exports = app => {
  const db = app.resDB;
  class MyService extends app.Service {
    // 查找作品
    async find(keyword, types, nsfw) {
      if (!keyword) {
        const titles = await db.Titles.simpleFind({ typeid: types, nsfw });
        return titles;
      }
      const titles = await db.Titles.simpleFind({ names: { [db.Sequelize.Op.like]: `%${keyword}%` }, typeid: types, nsfw });
      return titles;
    }
  }
  return MyService;
};
