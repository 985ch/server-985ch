// 请求来源服务器的管理
'use strict';

const _ = require('lodash');

module.exports = app => {
  const db = app.mainDB;
  const cache = app.cache9.get('mem');
  class MyService extends app.Service {
    // 根据密钥获取相关客户端的数据
    async info(secret) {
      const sources = await cache.get('res:src', async () => {
        const raws = await db.Clients.simpleFind();
        return _.keyBy(raws, 'secret');
      });

      const config = sources[secret];
      if (!config || !this.testIP(config.ips)) return null;
      return config;
    }
    // 检查IP是否符合要求
    testIP(ips) {
      const ip = this.ctx.ip;
      const len = ips.length;
      for (let i = 0; i < len; i++) {
        if (ips[i].test(ip)) return true;
      }
      return false;
    }
  }
  return MyService;
};
