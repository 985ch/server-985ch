'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.mainDB.define('clients', {
    secret: { type: DataTypes.STRING(50), allowNull: false, primaryKey: true }, // 密钥
    ips: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }, // IP白名单，用逗号隔开
    config: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' }, // 配置信息，是个JSON
  }, {
    tableName: 'clients',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model, [ 'secret', 'ips', 'config' ], [
    {
      list: [ 'ips' ], // 解析为正则表达式
      filter: raw => {
        const regs = [];
        const list = raw.split(',');
        for (const itm of list) {
          regs.push(new RegExp(itm.replace(/\*/g, '\\d+')));
        }
        return regs;
      },
    },
    {
      list: [ 'config' ], // 解析为JSON
      filter: raw => utils.pJson(raw, null),
    },
  ]);
  model.associate = function() {
  };

  return model;
};
