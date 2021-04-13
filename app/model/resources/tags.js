'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 标签列表
  const model = app.resDB.define('tags', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 标签ID
    typeid: { type: DataTypes.INTEGER(11), allowNull: false, defaultValue: '0' }, // 标签类型ID
    tag: { type: DataTypes.STRING(50), allowNull: false }, // 标签
  }, {
    tableName: 'tags',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
