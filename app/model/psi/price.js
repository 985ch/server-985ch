'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.psiDB.define('price', {
    goodsid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 商品ID
    level: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 用户等级
    price: { type: DataTypes.DECIMAL, allowNull: false }, // 价格
  }, {
    tableName: 'price',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
