'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.psiDB.define('storage', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false }, // 仓库名称
    memberid: { type: DataTypes.INTEGER(11), allowNull: false, defaultValue: '0' }, // 仓库关联成员，0为自己
    type: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 仓库类型 0 自家仓库 1 自己给他人代持 2 他人代持自己
    balance: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: '0.00' }, // 余额
    info: { type: DataTypes.TEXT, allowNull: false }, // 仓库描述
    hide: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 是否隐藏该仓库
  }, {
    tableName: 'storage',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
