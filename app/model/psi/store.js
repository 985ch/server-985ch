'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
  // -------- begin sequelize-mg replace --------
  const model = app.psiDB.define('store', {
    goodsid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 商品ID
    storeid: { type: DataTypes.INTEGER(11), allowNull: false, primaryKey: true }, // 所属仓库ID
    num: { type: DataTypes.INTEGER(11), allowNull: false, defaultValue: '0' }, // 商品数量
  }, {
    tableName: 'store',
  });
  // -------- end sequelize-mg replace --------

  utils.extendModel(model, [ 'goodsid', 'storeid', 'num' ]);
  model.associate = function() {
    app.psiDB.Store.belongsTo(
      app.psiDB.Storage,
      { as: 'storage', foreignKey: 'storeid', targetKey: 'id' }
    );
    app.psiDB.Store.belongsTo(
      app.psiDB.Goods,
      { as: 'goods', foreignKey: 'goodsid', targetKey: 'id' }
    );
  };

  return model;
};
