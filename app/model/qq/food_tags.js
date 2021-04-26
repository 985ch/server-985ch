'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 食物标签
  const model = app.qqDB.define('food_tags', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true },
    tag: { type: DataTypes.STRING(50), allowNull: false }, // 标签
  }, {
    tableName: 'food_tags',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
    app.qqDB.FoodTags.belongsTo(app.qqDB.FoodMenutag, {
      foreignKey: 'id',
      targetKey: 'tid',
    });
  };

  return model;
};
