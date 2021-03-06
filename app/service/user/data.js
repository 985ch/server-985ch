// 处理用户缓存数据

'use strict';

const crypto = require('crypto');
const _ = require('lodash');
const saltText = 'server-985ch@sihXXqo65eiZnd##XDIURNE;1187===678rtFFEzzCN.';

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
      const code = this.ctx.helper.randString(6, '0123456789');
      await redis.setex(`login:${qq}#${code}`, timeout, qq);
      return code;
    }
    // 用户登陆
    async login(qq, x) {
      if (x.length === 6) {
        return await this.loginByCode(qq + '#' + x);
      }
      return await this.loginByPwd(qq, x);
    }
    // 用登陆码登陆
    async loginByCode(code) {
      const key = `login:${code}`;
      const qq = await redis.get(key);
      if (!qq) return null;
      await redis.del(key);
      return await this.service.user.cache.newToken(qq);
    }
    // 用密码登陆
    async loginByPwd(qq, md5) {
      const password = this.saltPassword(qq, md5);
      const user = await db.Users.simpleFindOne({ qq, password });
      if (user) {
        return await this.service.user.cache.newToken(qq);
      }
      return null;
    }
    // 给密码加盐
    saltPassword(qq, md5) {
      const str = qq + saltText + md5;
      const result = crypto.createHash('md5').update(str, 'utf8').digest('hex');
      return result.toUpperCase();
    }
    // 设置用户权限
    async setRoles(qq, roles) {
      await db.Users.update({ rights: JSON.stringify(roles) }, { where: { qq } });
      this.service.user.cache.update(qq);
    }
    // 设置用户配置
    async setConfig(qq, config, key, value) {
      config[key] = value;
      await db.Users.update({ config: JSON.stringify(config) }, { where: { qq } });
      await this.service.user.cache.update(qq);
    }
    // 检查权限
    checkPermission(roles, permission) {
      if (permission === true) return true;
      permission = _.castArray(permission);
      for (const cur of permission) {
        if (roles.indexOf(cur) >= 0) return true;
      }
      return false;
    }
  }
  return MyService;
};
