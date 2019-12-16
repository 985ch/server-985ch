'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.resDB.define('titleres', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 自增ID
    titleid: { type: DataTypes.INTEGER(11), allowNull: false }, // 作品ID
    resid: { type: DataTypes.INTEGER(11), allowNull: false }, // 资源ID
  }, {
    tableName: 'titleres',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
