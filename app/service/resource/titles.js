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
    // 获取作品相关数据
    async getData(id) {
      const base = await db.Titles.simpleFindOne({ id });
      const res = await db.Resources.findAll({
        attributes: [
          [ db.Sequelize.literal('titleres.id'), 'id' ],
          [ db.Sequelize.literal('titleres.folder'), 'folder' ],
          [ 'id', 'resid' ], 'source', 'path', 'valid', 'updatetime' ],
        include: [{
          model: db.Titleres,
          as: 'titleres',
          attributes: [],
          where: {
            titleid: id,
          },
        }],
        raw: true,
      });
      return { base, res };
    }
    // 写入数据
    async save(userid, { id, typeid, names, releaseTime, pic, info, nsfw }) {
      const data = {
        userid,
        typeid,
        names,
        pic,
        release_time: new Date(releaseTime),
        add_time: new Date(),
        info,
        nsfw,
        public: 1,
      };
      if (id > 0) {
        await db.Titles.update(data, { where: { id } });
        data.id = id;
        return data;
      }
      return await db.Titles.create(data);
    }
  }
  return MyService;
};
