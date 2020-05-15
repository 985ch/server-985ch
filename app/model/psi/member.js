'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.psiDB.define('member', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false }, // 名字
    level: { type: DataTypes.INTEGER(11), allowNull: false, defaultValue: '0' }, // 成员级别 0 客户 1 会员 2 三级代理 3 二级代理 4 总代理
    type: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 成员类型 0 客户 1 供应商 2 自己
    info: { type: DataTypes.TEXT, allowNull: false }, // 备注
    hide: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 是否隐藏
  }, {
    tableName: 'member',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
