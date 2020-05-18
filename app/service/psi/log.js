// 进销存系统销售记录处理
'use strict';

const _ = require('lodash');

module.exports = app => {
  const db = app.psiDB;
  class MyService extends app.Service {
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
            const oldData = { store: 0, cost: 0, goods: [] };
            const newData = { store: log.storeid, cost: log.cost, goods };
            await this.updateGoods(id, oldData, newData, type === 1);
          }
          break;
        case 2:
        case 3:
          await this.updateBalance(0, 0, log.storeid, log.cost, type === 3);
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
            const newData = { store: 0, cost: 0, goods: [] };
            const oldData = { store: log.storeid, cost: log.cost, goods };
            await this.updateGoods(id, oldData, newData, type === 1);
          }
          break;
        case 2:
        case 3:
          await this.updateBalance(log.storeid, log.cost, 0, 0, type === 3);
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
            const oldData = { store: oldLog.storeid, cost: oldLog.cost, goods: oldGoods };
            const newData = { store: log.storeid, cost: log.cost, goods };
            await this.updateGoods(id, oldData, newData, type === 1);
          }
          break;
        case 2:
        case 3:
          await this.updateBalance(oldLog.storeid, oldLog.cost, log.storeid, log.cost, type === 3);
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
    async updateGoods(logid, oldData, newData, isSale) {
      const stores = db.Storage.simpleFind({ id: [ oldData.store, newData.store ] }, [ 'id', 'type' ]);
      const storeTypes = {};
      _.forEach(stores, store => { storeTypes[store.id] = store.type; });

      if (storeTypes[newData.store] === 0 && storeTypes[oldData.store] === 0) {
        await this.updateBalance(oldData.store, oldData.cost, newData.store, newData.cost, isSale);
        return;
      }
      if (storeTypes[oldData.store] === 0) {
        await this.updateBalance(oldData.store, oldData.cost, 0, 0, isSale);
        oldData = { store: 0, cost: 0, goods: [] };
      }
      if (storeTypes[newData.store] === 0) {
        await this.updateBalance(0, 0, newData.store, newData.cost, isSale);
        newData = { store: 0, cost: 0, goods: [] };
      }

      const ids = [];
      for (const cur of oldData.goods) {
        const found = _.find(newData.goods, obj => cur.goodsid === obj.goodsid);
        if (!found) {
          ids.push(cur.goodsid);
        }
        if (!found || oldData.store !== newData.store) {
          await this.updateStoreGoods(oldData.store, cur.goodsid, isSale ? cur.num : -cur.num);
        }
      }
      await db.Goodslog.update({ num: 0 }, { where: { logid, goodsid: ids } });

      for (const cur of newData.goods) {
        const found = _.find(oldData.goods, obj => cur.goodsid === obj.goodsid);
        db.Goodslog.upsert({ logid, goodsid: cur.goodsid, num: cur.num });
        if (found && oldData.store === newData.store) {
          const change = cur.num - found.num;
          await this.updateStoreGoods(newData.store, cur.goodsid, isSale ? -change : change);
        } else {
          await this.updateStoreGoods(newData.store, cur.goodsid, isSale ? -cur.num : cur.num);
        }
      }
    }
    async updateStoreBalance(id, change) {
      if (change === 0) return;
      await db.Storage.increment({ balance: change }, { where: { id } });
    }
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
