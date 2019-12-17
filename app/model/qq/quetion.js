'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.qqDB.define('quetion', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 问题ID
    groupid: { type: DataTypes.INTEGER(11), allowNull: false }, // 关联群号，0表示所有群
    text: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 问题文本，用换行隔开
    answer: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 回答模板，用换行隔开
    qq: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '' }, // 问题添加者
  }, {
    tableName: 'quetion',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
