'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.psiDB.define('logs', {
    id: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '0' }, // 订单类型 0 进货 1 销售
    memberid: { type: DataTypes.INTEGER(11), allowNull: false }, // 目标对象
    amount: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: '0.00' }, // 金额，为正数时指收入，为负数时指支出
    postage: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: '0.00' }, // 邮费，一般为正数或0
    info: { type: DataTypes.TEXT, allowNull: true }, // 备注
    logtime: { type: DataTypes.DATE, allowNull: false, defaultValue: app.psiDB.fn('current_timestamp') }, // 订单时间
    status: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 订单状态 0 未完成 1 完成
    enabled: { type: DataTypes.INTEGER(4), allowNull: false, defaultValue: '1' }, // 是否有效
  }, {
    tableName: 'logs',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model, [ 'id', 'type', 'memberid', 'amount', 'postage', 'info', 'logtime', 'status' ], [
    {
      list: [ 'amount', 'postage' ],
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
