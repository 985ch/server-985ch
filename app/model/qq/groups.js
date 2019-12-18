'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.qqDB.define('groups', {
    id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true }, // 群号
    name: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '' }, // 群名称
    config: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 配置JSON
    plugins: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // 启用组件
    active: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 群是否激活
    updatetime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.qqDB.fn('current_timestamp') }, // 更新时间
  }, {
    tableName: 'groups',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model, [ 'id', 'name', 'config', 'plugins', 'active', 'updatetime' ], [{
    list: [ 'plugins' ],
    filter: raw => (raw ? raw.split(',') : []),
  }, {
    list: [ 'config' ],
    filter: raw => utils.pJson(raw, null),
  }]);
  model.associate = function() {
  };

  return model;
};
