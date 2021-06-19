'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 菜单和标签关联表
  const model = app.qqDB.define('food_menutag', {
    mid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 菜单ID
    tid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 标签ID
    enable: { type: DataTypes.INTEGER(4), allowNull: false }, // 是否启用
  }, {
    tableName: 'food_menutag',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
    app.qqDB.FoodMenutag.belongsTo(app.qqDB.FoodTags, {
      foreignKey: 'tid',
      targetKey: 'id',
      as: 'food_tags',
    });
    app.qqDB.FoodMenutag.belongsTo(app.qqDB.FoodMenu, {
      foreignKey: 'mid',
      targetKey: 'id',
      // as: 'food_menu',
    });
  };

  return model;
};
