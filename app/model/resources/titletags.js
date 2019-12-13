'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.resDB.define('titletags', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 自增ID
    titleid: { type: DataTypes.INTEGER(11), allowNull: false }, // 作品ID
    tagid: { type: DataTypes.INTEGER(11), allowNull: false }, // 标签ID
  }, {
    tableName: 'titletags',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
