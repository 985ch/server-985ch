'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.qqDB.define('respond', {
    md5: { type: DataTypes.STRING(32), allowNull: false, primaryKey: true }, // 短MD5
    groupid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 所属群ID，该值为0即所有群通用
    text: { type: DataTypes.TEXT, allowNull: false }, // 应答文本内容
    enable: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 是否可用
    qq: { type: DataTypes.STRING(20), allowNull: true }, // 添加者
    createtime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.qqDB.fn('current_timestamp') }, // 创建时间
  }, {
    tableName: 'respond',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
