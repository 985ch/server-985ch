'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 商品表
  const model = app.psiDB.define('goods', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '' }, // 商品名
    info: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 商品描述
    hide: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 是否隐藏
  }, {
    tableName: 'goods',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
