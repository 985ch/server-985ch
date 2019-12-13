'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.resDB.define('tagtype', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 类型ID
    name: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '0' }, // 类型名称
    note: { type: DataTypes.TEXT, allowNull: false, defaultValue: '0' }, // 备注
  }, {
    tableName: 'tagtype',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
