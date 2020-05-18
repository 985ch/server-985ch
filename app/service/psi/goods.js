// 商品管理
'use strict';

const _ = require('lodash');

const maxLevel = 6;

module.exports = app => {
  const db = app.psiDB;
  class MyService extends app.Service {
    async getData() {
      const goods = await db.Goods.simpleFind();
      const prices = await db.Price.simpleFind();
      const priceGroups = _.groupBy(prices, 'goodsid');
      _.forEach(goods, item => {
        item.prices = this.getPrices(priceGroups[item.id]);
      });
      return goods;
    }
    async upsert(fields, prices) {
      let result;
      if (fields.id) {
        await db.Goods.update(fields, { where: { id: fields.id } });
        result = fields;
      } else {
        delete fields.id;
        result = await db.Goods.create(fields);
      }
      await this.savePrices(result.id, prices);
      fields.prices = prices;
      return result;
    }
    getPrices(list) {
      const result = new Array(maxLevel);
      for (let i = 0; i < maxLevel; i++) {
        const idx = _.findIndex(list, obj => obj.level === i);
        if (idx >= 0) {
          result[i] = list[idx].price;
        } else {
          result[i] = i > 0 ? result[i - 1] : 888;
        }
      }
      return result;
    }
    async savePrices(goodsid, prices) {
      const max = Math.min(prices.length, maxLevel);
      for (let level = 0; level < max; level++) {
        await db.Price.upsert({ goodsid, level, price: prices[level] });
      }
    }
  }
  return MyService;
};
