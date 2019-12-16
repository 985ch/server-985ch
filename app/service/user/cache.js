// 处理用户缓存数据

'use strict';

const { randString } = require('egg-sachikawa').Utils;

const curVersion = 0;
const expireTime = 3600 * 24 * 7;

function getKey(token) {
  return 'g:' + token;
}

module.exports = app => {
  const redis = app.redis.get('main');
  const db = app.mainDB;
  class MyService extends app.Service {
    // 通过token获取用户信息
    async get(token, forceUpdate = false) {
      const key = getKey(token);
      const raw = await redis.get(key);
      if (raw) {
        let data = JSON.parse(raw);
        if (forceUpdate || data.v < curVersion) {
          data = await this.create(token, data.qq);
          await redis.setex(key, expireTime, JSON.stringify(data));
        } else {
          await redis.expire(key, expireTime);
        }
        return data;
      }
      return {
        token: '',
        userid: -1,
        qq: 'unknown',
        nick: 'anonymous',
        roles: [],
        config: {},
        v: curVersion,
      };
    }
    // 确认用户是否具备相应权限
    checkPermission(userdata, permission) {
      return permission === true || userdata.roles.indexOf(permission) >= 0;
    }
    // 重新获取用户信息
    async update(token) {
      const data = await this.get(token, true);
      return data.userid >= 0;
    }
    // 添加用户信息
    async add(qq) {
      const token = `${qq}#${randString()}`;
      const data = await this.create(token, qq);
      const oldToken = await this.getToken(qq);
      if (oldToken) await this.remove(oldToken);
      await redis.setex(getKey(token), expireTime, JSON.stringify(data));
      return { token, data };
    }
    // 获取用户token
    async getToken(qq) {
      const keys = await redis.keys(`g:${qq}#*`);
      return (keys.length > 0) ? keys[0].substring(2) : null;
    }
    // 清除用户信息
    async remove(token) {
      await redis.del(getKey(token));
    }
    // 创建用户信息
    async create(token, qq) {
      const user = await db.Users.simpleFindOne({ qq });
      if (!user) throw new Error('无效的用户');
      return {
        token,
        userid: user.id,
        qq: user.qq,
        nick: user.nickname,
        roles: user.rights,
        config: user.config,
        v: curVersion,
      };
    }
  }
  return MyService;
};
