'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.resDB.define('images', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true }, // 图片ID
    raw: { type: DataTypes.STRING(400), allowNull: false, defaultValue: '0' }, // 来源路径
    md5: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '' }, // 哈希值
    length: { type: DataTypes.INTEGER(11), allowNull: false, defaultValue: '0' }, // 图片大小
    extname: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'jpg' }, // 图片扩展名
    userid: { type: DataTypes.INTEGER(11), allowNull: false }, // 上传用户
    uploadtime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.resDB.fn('current_timestamp') }, // 上传时间
    nsfw: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 是否NSFW
    public: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 是否公开 1 全局公开 0 不公开
    info: { type: DataTypes.TEXT, allowNull: true }, // 简介
  }, {
    tableName: 'images',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
