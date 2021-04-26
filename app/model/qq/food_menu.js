'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 菜单
  const model = app.qqDB.define('food_menu', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 菜单
    groupid: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true }, // 归属群 为0表示所有群可用
    name: { type: DataTypes.STRING(50), allowNull: false }, // 菜单名称
    enable: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 是否可用
    creator: { type: DataTypes.BIGINT, allowNull: false }, // 添加者
    updatetime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.qqDB.fn('current_timestamp') }, // 更新时间
  }, {
    tableName: 'food_menu',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
    app.qqDB.FoodMenu.belongsTo(app.qqDB.FoodMenuing, {
      foreignKey: 'id',
      targetKey: 'mid',
    });
    app.qqDB.FoodMenu.belongsTo(app.qqDB.FoodMenutag, {
      foreignKey: 'id',
      targetKey: 'mid',
    });
  };

  return model;
};
