'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.qqDB.define('groupmember', {
    groupid: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true }, // 群号
    qq: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true }, // QQ
    nick: { type: DataTypes.STRING(50), allowNull: true }, // 昵称
    nickinfo: { type: DataTypes.TEXT, allowNull: true }, // 昵称来源（已压缩编码）
    active: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 群成员是否激活
  }, {
    tableName: 'groupmember',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
