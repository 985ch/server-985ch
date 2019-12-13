'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.resDB.define('notes', {
    typeid: { type: DataTypes.INTEGER(4), allowNull: false, primaryKey: true }, // 类型ID，0作品，1角色，2图片
    titleid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 作品ID
    userid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 用户ID
    note: { type: DataTypes.TEXT, allowNull: true }, // 备注
    update_time: { type: DataTypes.DATE, allowNull: true, defaultValue: app.resDB.fn('current_timestamp') }, // 更新时间
  }, {
    tableName: 'notes',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
