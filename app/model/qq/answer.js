'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.qqDB.define('answer', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 自增ID
    qid: { type: DataTypes.INTEGER(11), allowNull: false }, // 对应的问题ID
    text: { type: DataTypes.STRING(50), allowNull: false }, // 答案内容
    weight: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: '1' }, // 权重
    qq: { type: DataTypes.STRING(20), allowNull: true }, // 添加者
    enable: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 启用状态
  }, {
    tableName: 'answer',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
