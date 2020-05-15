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
      for (const cur of goods) {
        cur.logid = id;
        await db.Goodslog.create(cur);
        await this.updateStoreGoods(cur.storeid, cur.goodsid, cur.num, log.type === 1);
      }
      return newLog.dataValues;
    }
    // 移除销售记录
    async del(id) {
      const log = await db.Logs.simpleFindOne({ id });
      if (!log) return [];

      const goods = await db.Goodslog.simpleFind({ logid: id });
      for (const cur of goods) {
        await this.updateStoreGoods(cur.storeid, cur.goodsid, cur.num, log.type === 0);
      }
      await db.Goodslog.update({ num: 0 }, { where: { logid: id } });
      await db.Logs.update({ enabled: 0 }, { where: { id } });
      return goods;
    }
    // 编辑销售记录
    async edit(id, log, goods) {
      await db.Logs.update(log, { where: { id } });

      const oldGoods = await db.Goodslog.simpleFind({ logid: id });
      // 清空原商品数据
      for (const cur of oldGoods) {
        if (_.findIndex(goods, obj => cur.goodsid === obj.goodsid && cur.storeid === obj.storeid) < 0) {
          await db.Goodslog.update({ num: 0 }, { where: { logid: id, goodsid: cur.goodsid, storeid: cur.storeid } });
          await this.updateStoreGoods(cur.storeid, cur.goodsid, cur.num, log.type === 0);
        }
      }

      for (const cur of goods) {
        const idx = _.findIndex(oldGoods, obj => cur.goodsid === obj.goodsid && cur.storeid === obj.storeid);

        if (idx < 0) { // 处理新增商品
          cur.logid = id;
          await db.Goodslog.create(cur);
          await this.updateStoreGoods(cur.storeid, cur.goodsid, cur.num, log.type === 1);
        } else { // 处理变更商品
          const change = cur.num - oldGoods[idx].num;
          await db.Goodslog.update({ num: cur.num }, { where: { logid: id, goodsid: cur.goodsid, storeid: cur.storeid } });
          await this.updateStoreGoods(cur.storeid, cur.goodsid, change, log.type === 1);
        }
      }
    }
    // 更新商品数量
    async updateStoreGoods(storeid, goodsid, change, minus) {
      if (change === 0) return;
      if (minus)change = -change;
      const result = await db.Store.increment({ num: change }, { where: { storeid, goodsid } });
      console.log(result);
      if (result[0][1] === 0) {
        await db.Store.create({ storeid, goodsid, num: change });
      }
    }
  }
  return MyService;
};
