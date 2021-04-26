'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 菜单和食材关联表
  const model = app.qqDB.define('food_menuing', {
    mid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 菜单ID
    iid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 食材ID
    enable: { type: DataTypes.INTEGER(4), allowNull: false }, // 是否启用
  }, {
    tableName: 'food_menuing',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
