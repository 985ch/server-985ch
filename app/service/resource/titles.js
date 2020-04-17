// 管理作品数据
'use strict';
const _ = require('lodash');

module.exports = app => {
  const db = app.resDB;
  class MyService extends app.Service {
    // 查找作品
    async find({ keyword, types, nsfw, concern, offset, limit }) {
      const notes = {
        model: db.Notes,
        as: 'notes',
        attributes: [],
        where: {
          typeid: 0,
          userid: this.ctx.state.userdata.userid,
        },
        required: false,
      };
      const titleres = {
        model: db.Titleres,
        as: 'titleres',
        attributes: [],
        required: false,
      };
      const where = {
        typeid: types,
        nsfw,
      };
      const findJson = {
        attributes: [
          ...db.Titles.defaultAttributes,
          [ db.Sequelize.literal('notes.like'), 'like' ],
          [ db.Sequelize.literal('notes.concern'), 'concern' ],
          [ db.Sequelize.fn('COUNT', db.Sequelize.col('titleres.titleid')), 'count' ],
        ],
        include: [ notes, titleres ],
        where,
        offset,
        limit,
        group: 'titles.id',
        order: [[ 'add_time', 'desc' ]],
        raw: true,
      };

      if (keyword) {
        where.names = { [db.Sequelize.Op.like]: `%${keyword}%` };
      }
      if (concern) {
        notes.where.concern = concern;
        notes.required = true;
      }
      const count = await db.Titles.count({ where, include: [ notes ] });
      const rows = await db.Titles.findAll(findJson);
      return { count, rows };
    }
    // 获取作品相关数据
    async getData(id) {
      const base = await db.Titles.simpleFindOne({ id }, _.keys(db.Titles.tableAttributes));
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
      const note = await this.service.resource.note.getNote(0, id);
      return { base, res, note };
    }
    // 写入数据
    async save(userid, data) {
      data.add_time = new Date();
      data.userid = userid;
      data.public = 1;
      const id = data.id;
      if (id > 0) {
        await db.Titles.update(data, { where: { id } });
        data.id = id;
        return data.data;
      }
      return await db.Titles.create(data);
    }
  }
  return MyService;
};
