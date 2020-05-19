// 进销存系统销售记录处理
'use strict';

const _ = require('lodash');

module.exports = app => {
  const db = app.psiDB;
  class MyService extends app.Service {
    // 校验传入的参数并返回校验结果
    checkInput({ id, type, memberid, storeid, amount, cost, postage, info, logtime, status, goods }) {
      if (memberid <= 0) return { fail: '无效的成员' };
      const log = { type, memberid, storeid, amount, cost, postage, info, logtime, status };
      if (type < 2 && goods.length === 0) return { fail: '货物不可为空' };
      if (type < 4 && storeid <= 0) return { fail: '必须选择正确的仓库' };
      if (type !== 1)goods.cost = 0;
      if (type >= 2) postage = 0;
      if (type >= 4) storeid = 0;
      return { id, log, goods };
    }
    // 获取销售记录
    async getData() {
      const logs = await db.Logs.simpleFind({ enabled: 1 });
      const goodsLog = await db.Goodslog.simpleFind({ num: { [db.Sequelize.Op.gt]: 0 } });
      const goodsGroups = _.groupBy(goodsLog, 'logid');
      _.forEach(logs, item => { item.goods = goodsGroups[item.id]; });
      return logs;
    }
    // 添加销售记录
    async add(log, goods) {
      const newLog = await db.Logs.create(log);
      const id = newLog.dataValues.id;

      const type = log.type;
      switch (type) {
        case 0:
        case 1:
          {
            const oldData = { store: 0, cost: 0, amount: 0, goods: [] };
            const newData = { store: log.storeid, cost: log.cost, amount: log.amount, goods };
            await this.updateGoods(id, oldData, newData, type === 1);
          }
          break;
        case 2:
        case 3:
          await this.updateBalance(0, 0, log.storeid, log.amount, true);
          break;
        default:
          break;
      }
      return newLog.dataValues;
    }
    // 移除销售记录
    async del(id) {
      const log = await db.Logs.simpleFindOne({ id, enabled: 1 });
      if (!log) return [];

      await db.Logs.update({ enabled: 0 }, { where: { id } });
      const goods = await db.Goodslog.simpleFind({ logid: id });

      const type = log.type;
      switch (type) {
        case 0:
        case 1:
          {
            const newData = { store: 0, cost: 0, amount: 0, goods: [] };
            const oldData = { store: log.storeid, cost: log.cost, amount: log.amount, goods };
            await this.updateGoods(id, oldData, newData, type === 1);
          }
          break;
        case 2:
        case 3:
          await this.updateBalance(log.storeid, log.amount, 0, 0, true);
          break;
        default:
          break;
      }
      return goods;
    }
    // 编辑销售记录
    async edit(id, log, goods) {
      const oldLog = await db.Logs.simpleFindOne({ id, enabled: 1 });
      if (!oldLog) return [];

      const type = oldLog.type;
      log.type = type;
      await db.Logs.update(log, { where: { id } });
      const oldGoods = await db.Goodslog.simpleFind({ logid: id });

      switch (type) {
        case 0:
        case 1:
          {
            const oldData = { store: oldLog.storeid, cost: oldLog.cost, amount: oldLog.amount, goods: oldGoods };
            const newData = { store: log.storeid, cost: log.cost, amount: log.amount, goods };
            await this.updateGoods(id, oldData, newData, type === 1);
          }
          break;
        case 2:
        case 3:
          await this.updateBalance(oldLog.storeid, oldLog.amount, log.storeid, log.amount, true);
          break;
        default:
          break;
      }
    }
    // 更新商品数量
    async updateStoreGoods(storeid, goodsid, change) {
      if (change === 0) return;
      const result = await db.Store.increment({ num: change }, { where: { storeid, goodsid } });
      if (result[0][1] === 0) {
        await db.Store.create({ storeid, goodsid, num: change });
      }
    }
    // 获取商品数据对应的变化数据
    async getGoodsTypeInfo(oldData, newData) {
      const stores = await db.Storage.simpleFind({ id: [ oldData.store, newData.store ] }, [ 'id', 'type' ]);
      const storeTypes = {};
      _.forEach(stores, store => { storeTypes[store.id] = store.type; });

      const datas = [ oldData, newData ];
      for (const data of datas) {
        const type = storeTypes[data.store];
        data.type = type;
        data.balance = type === 0 ? 0 : type === 1 ? data.amount : data.cost;
      }
      return { oldData, newData };
    }
    // 更新商品数据
    async updateGoods(logid, oldRaw, newRaw, isSale) {
      const { oldData, newData } = await this.getGoodsTypeInfo(oldRaw, newRaw);

      await this.updateBalance(oldData.store, oldData.balance, newData.store, newData.balance, !isSale);

      const ids = [];
      for (const cur of oldData.goods) {
        const found = _.find(newData.goods, obj => cur.goodsid === obj.goodsid);
        if (!found) {
          ids.push(cur.goodsid);
        }
        if (oldData.type === 0 && (!found || oldData.store !== newData.store)) {
          await this.updateStoreGoods(oldData.store, cur.goodsid, isSale ? cur.num : -cur.num);
        }
      }
      await db.Goodslog.update({ num: 0 }, { where: { logid, goodsid: ids } });

      for (const cur of newData.goods) {
        const found = _.find(oldData.goods, obj => cur.goodsid === obj.goodsid);
        db.Goodslog.upsert({ logid, goodsid: cur.goodsid, num: cur.num });
        if (newData.type === 0) {
          if (found && oldData.store === newData.store) {
            const change = cur.num - found.num;
            await this.updateStoreGoods(newData.store, cur.goodsid, isSale ? -change : change);
          } else {
            await this.updateStoreGoods(newData.store, cur.goodsid, isSale ? -cur.num : cur.num);
          }
        }
      }
    }
    // 更新仓库余额
    async updateStoreBalance(id, change) {
      if (change === 0) return;
      await db.Storage.increment({ balance: change }, { where: { id } });
    }
    // 更新仓库数据
    async updateBalance(oldStore, oldCost, newStore, newCost, isIncome) {
      if (oldStore === newStore) {
        await this.updateStoreBalance(oldStore, isIncome ? newCost - oldCost : oldCost - newCost);
      } else {
        await this.updateStoreBalance(oldStore, isIncome ? -oldCost : oldCost);
        await this.updateStoreBalance(newStore, isIncome ? newCost : -newCost);
      }
    }
  }
  return MyService;
};
