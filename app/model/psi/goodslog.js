'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.psiDB.define('goodslog', {
    logid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 对应订单ID
    goodsid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 对应商品ID
    num: { type: DataTypes.INTEGER(11), allowNull: false }, // 数量
  }, {
    tableName: 'goodslog',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model, [ 'logid', 'goodsid', 'num' ]);
  model.associate = function() {
    app.psiDB.Goodslog.belongsTo(
      app.psiDB.Logs,
      { as: 'logs', foreignKey: 'logid', targetKey: 'id' }
    );
    app.psiDB.Goodslog.belongsTo(
      app.psiDB.Goods,
      { as: 'goods', foreignKey: 'goddsid', targetKey: 'id' }
    );
  };

  return model;
};
