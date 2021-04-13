'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 作品信息
  const model = app.resDB.define('titles', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 作品id
    userid: { type: DataTypes.INTEGER(11), allowNull: false, defaultValue: '0' }, // 添加用户的id
    typeid: { type: DataTypes.INTEGER(11), allowNull: false, defaultValue: '0' }, // 作品分类id
    names: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 作品名，多个名字用换行符隔开
    pic: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 图片链接
    release_time: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: app.resDB.fn('current_timestamp') }, // 作品发布日期
    add_time: { type: DataTypes.DATE, allowNull: false, defaultValue: app.resDB.fn('current_timestamp') }, // 作品添加时间
    info: { type: DataTypes.TEXT, allowNull: true }, // 作品信息
    nsfw: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 是否NSFW
    public: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 是否公开 1 全局公开 0 不公开
  }, {
    tableName: 'titles',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model, [ 'id', 'typeid', 'names', 'pic', 'release_time', 'add_time', 'nsfw' ]);
  model.associate = function() {
  };

  return model;
};
