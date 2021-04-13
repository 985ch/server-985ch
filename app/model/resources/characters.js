'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 角色
  const model = app.resDB.define('characters', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 角色id
    userid: { type: DataTypes.INTEGER(11), allowNull: false }, // 添加用户
    names: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 角色名字，多个用换行符隔开
    info: { type: DataTypes.TEXT, allowNull: true }, // 角色信息
    add_time: { type: DataTypes.DATE, allowNull: true, defaultValue: app.resDB.fn('current_timestamp') }, // 添加时间
  }, {
    tableName: 'characters',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
