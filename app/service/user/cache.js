// 处理用户缓存数据

'use strict';

const curVersion = 0;
const expireTime = 3600 * 24 * 7;

function getTokenKey(token) {
  return 'g:' + token;
}

module.exports = app => {
  const redis = app.redis.get('main');
  const db = app.mainDB;
  const cache = app.cache9.get('main');
  class MyService extends app.Service {
    // 通过token获取用户信息
    async getByToken(token) {
      let data = {
        userid: -1,
        qq: 0,
        nick: 'anonymous',
        roles: [],
        config: {},
        v: curVersion,
      };
      const key = getTokenKey(token);
      const qq = await redis.get(key);
      if (qq) {
        data = await this.getByQQ(qq);
        if (data.v < curVersion) {
          data = await this.getByQQ(qq, true);
        }
        await redis.expire(key, expireTime);
      }
      return data;
    }
    // 更新用户数据
    async update(qq) {
      cache.clear(`qq:${qq}`);
    }
    // 添加token供用户使用
    async newToken(qq) {
      const token = `${qq}#${this.ctx.helper.randString(24)}`;
      // 清除旧的验证信息
      const keys = await redis.keys(`g:${qq}#*`);
      if (keys.length > 0) {
        for (const key of keys) {
          await redis.del(key);
        }
      }
      await redis.setex(getTokenKey(token), expireTime, qq);
      return token;
    }
    // 清除用户信息
    async remove(token) {
      await redis.del(getTokenKey(token));
    }
    // 根据QQ号获取用户信息，若用户不存在则创建用户
    async getByQQ(qq, update = false) {
      return await cache.get(`qq:${qq}`, async () => {
        let user = await db.Users.simpleFindOne({ qq });
        if (!user) {
          const created = await db.Users.create({
            qq,
            rights: 'qqbot',
            lastIP: this.ip,
          });
          user = db.Users.filterAll(created.dataValues);
        }
        return {
          userid: user.id,
          qq: user.qq,
          nick: user.nick,
          roles: user.rights,
          config: user.config,
          v: curVersion,
        };
      }, { ttl: 3600, update });
    }
  }
  return MyService;
};
