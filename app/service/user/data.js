// 处理用户缓存数据

'use strict';

const { randString } = require('egg-sachikawa').Utils;

const timeout = 5 * 60;

module.exports = app => {
  const redis = app.redis.get('main');
  const db = app.mainDB;
  class MyService extends app.Service {
    // 根据qq号生成登陆码
    async genCode(qq) {
      // 清除旧的登陆码
      const keys = await redis.keys(`login:${qq}#*`);
      if (keys.length > 0) {
        for (const key of keys) {
          await redis.del(key);
        }
      }
      // 生成新的登陆码
      const code = `${qq}#${randString()}`;
      await redis.setex(`login:${code}`, timeout, qq);
    }
    // 用户登陆
    async login(code) {
      const qq = await redis.get(`login:${code}`);
      if (!qq) return null;
      const data = await this.service.user.cache.add(qq);
      return data.token;
    }
    // 设置用户权限
    async setRoles(qq, roles) {
      await db.Users.update({ rights: JSON.stringify(roles) }, { where: { qq } });
      const cache = this.service.user.cache;
      const token = await cache.getToken(qq);
      if (token) await cache.update(token);
    }
    // 设置用户配置
    async setConfig(key, value) {
      const { token, userid, config } = this.ctx.state.userdata;
      config[key] = value;
      await db.Users.update({ config: JSON.stringify(config) }, { where: { id: userid } });
      await this.service.user.cache.update(token);
    }
  }
  return MyService;
};
