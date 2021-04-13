'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 角色标签
  const model = app.resDB.define('charatags', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 自增ID
    charaid: { type: DataTypes.INTEGER(11), allowNull: false }, // 角色ID
    tagid: { type: DataTypes.INTEGER(11), allowNull: false }, // 标签ID
  }, {
    tableName: 'charatags',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
