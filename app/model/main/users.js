'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.mainDB.define('users', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true },
    qq: { type: DataTypes.STRING(20), allowNull: true }, // 绑定QQ
    nickname: { type: DataTypes.STRING(30), allowNull: true }, // 昵称
    rights: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' }, // 用户权限 'root','admin','qqbot',
    config: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' }, // 个人配置 qqbot
    lastIP: { type: DataTypes.STRING(30), allowNull: true }, // 最后一次登陆IP
  }, {
    tableName: 'users',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
