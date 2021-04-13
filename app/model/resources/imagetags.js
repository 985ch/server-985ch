'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 图片标签
  const model = app.resDB.define('imagetags', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true },
    tagid: { type: DataTypes.INTEGER(11), allowNull: false },
    imageid: { type: DataTypes.INTEGER(11), allowNull: false },
  }, {
    tableName: 'imagetags',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
