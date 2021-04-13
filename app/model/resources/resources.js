'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  // 资源表
  const model = app.resDB.define('resources', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, autoIncrement: true }, // 自增ID
    source: { type: DataTypes.STRING(50), allowNull: false, primaryKey: true }, // 资源来源
    path: { type: DataTypes.STRING(200), allowNull: false, primaryKey: true }, // 资源路径
    bind: { type: DataTypes.INTEGER(11), allowNull: false, defaultValue: '0' }, // 关联作品数量
    info: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 资源内容（base64+gzip）
    valid: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 是否有效
    updatetime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.resDB.fn('current_timestamp') }, // 更新时间
  }, {
    tableName: 'resources',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model, [ 'id', 'source', 'path', 'bind', 'valid', 'updatetime' ]);
  model.associate = function() {
  };

  return model;
};
