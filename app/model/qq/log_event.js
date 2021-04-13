'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 事件日志
  const model = app.qqDB.define('log_event', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 自增ID
    type: { type: DataTypes.STRING(50), allowNull: false }, // 事件名称
    event_time: { type: DataTypes.DATE, allowNull: false, defaultValue: app.qqDB.fn('current_timestamp') }, // 事件时间
    info: { type: DataTypes.TEXT, allowNull: true }, // 额外信息JSON
  }, {
    tableName: 'log_event',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
