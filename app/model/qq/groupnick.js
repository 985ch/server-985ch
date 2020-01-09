'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.qqDB.define('groupnick', {
    groupid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, //  群号
    qq: { type: DataTypes.STRING(20), allowNull: false, primaryKey: true }, // QQ
    addedUser: { type: DataTypes.STRING(20), allowNull: false, primaryKey: true }, // 添加者
    nick: { type: DataTypes.STRING(20), allowNull: false }, // 昵称
    score: { type: DataTypes.INTEGER(11), allowNull: false }, // 昵称积分
    addedTime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.qqDB.fn('current_timestamp') }, // 添加时间
  }, {
    tableName: 'groupnick',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
