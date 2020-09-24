'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.psiDB.define('logs', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 订单类型 0 进货 1 出货 2 充值 3 储值 4 其他支出 5 其他收入 
    memberid: { type: DataTypes.INTEGER(11), allowNull: false }, // 目标对象
    storeid: { type: DataTypes.INTEGER(11), allowNull: true, defaultValue: '1' }, // 相关仓库
    amount: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: '0.00' }, // 金额
    cost: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: '0.00' }, // 货物成本
    postage: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: '0.00' }, // 邮费/额外成本
    info: { type: DataTypes.TEXT, allowNull: true }, // 备注
    logtime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.psiDB.fn('current_timestamp') }, // 订单时间
    status: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 订单状态 0 未完成 1 完成
    enabled: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 是否有效
  }, {
    tableName: 'logs',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model, [ 'id', 'type', 'memberid', 'storeid', 'amount', 'cost', 'postage', 'info', 'logtime', 'status' ], [
    {
      list: [ 'amount', 'cost', 'postage' ],
      filter: raw => Number.parseFloat(raw),
    },
  ]);
  model.associate = function() {
    app.psiDB.Logs.belongsTo(
      app.psiDB.Member,
      { as: 'member', foreignKey: 'memberid', targetKey: 'id' }
    );
  };

  return model;
};
