'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 食材
  const model = app.qqDB.define('food_ingredient', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 自增ID
    name: { type: DataTypes.STRING(50), allowNull: false }, // 食材名称
    creator: { type: DataTypes.BIGINT, allowNull: false }, // 添加者
    createtime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.qqDB.fn('current_timestamp') }, // 更新时间
  }, {
    tableName: 'food_ingredient',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
    app.qqDB.FoodIngredient.belongsTo(app.qqDB.FoodMenuing, {
      foreignKey: 'id',
      targetKey: 'iid',
    });
  };

  return model;
};
