// QQ群数据管理组件
'use strict';

const _ = require('lodash');

const defaultPlugins = [ 'base' ].join(',');
const historyLimit = 50;

module.exports = app => {
  const cache = app.cache9.get('main');
  const memory = app.cache9.get('mem');
  const db = app.qqDB;
  const botCfg = app.config.qqbot;
  class MyService extends app.Service {
    // 获取群数据
    async getData(groupid, groupName) {
      if (!groupid) {
        return {
          id: 0,
          name: 'unknown',
          plugins: [],
          config: {},
        };
      }
      const data = await memory.get(`g-data:${groupid}`, async () => {

        // 从数据库获取群配置，并根据实际情况添加或者更新数据
        let dbData = await db.Groups.simpleFindOne({ id: groupid });
        if (!dbData) {
          const created = await db.Groups.create({
            id: groupid,
            name: groupName,
            plugins: defaultPlugins,
            config: '{}',
            active: 1,
          });
          dbData = db.Groups.filterAll(created.dataValues);
        } else if (groupName && dbData.name !== groupName) {
          await db.Groups.update({
            name: groupName,
            updatetime: Date.now(),
          }, {
            where: { id: groupid },
          });
        }
        return {
          id: groupid,
          name: groupName,
          plugins: dbData.active ? dbData.plugins : [],
          config: dbData.config,
        };
      }, { ttl: 3600 });
      return data;
    }
    // 获取群成员列表
    async getGroupMembers(groupid, update = false) {
      return await memory.get(`g-members:${groupid}`, async () => {
        const mirai = this.service.rpc.mirai;
        const list = await mirai.memberList(groupid);
        const self = await mirai.memberInfo(groupid, botCfg.qq);
        list.push({ id: Number.parseInt(botCfg.qq), memberName: self.nick || self.name });
        const qq = {};
        const nickname = {};
        for (const member of list) {
          qq[member.id] = { id: member.id, memberName: member.memberName };
          this.ctx.helper.pushToObj(nickname, [ member.memberName ], member.id);
        }
        return { qq, nickname };
      }, { ttl: 1800, update });
    }
    // 获取群列表
    async getGroupList() {
      return await memory.get('g-list', async () => {
        const list = await this.service.rpc.mirai.groupList();
        return _.map(list, 'id');
      }, { ttl: 300 });
    }
    // 获取所有包含用户的群
    async getUserGroups(qq) {
      const groups = await this.getGroupList();
      const result = [];
      for (const groupid of groups) {
        const members = await this.getGroupMembers(groupid);
        if (members.qq[qq])result.push(groupid);
      }
      return result;
    }
    // 修改群配置信息
    async setConfig(groupid, config) {
      await db.Groups.update({
        config: JSON.stringify(config),
      }, {
        where: { id: groupid },
      });
      await memory.clear(`g-data:${groupid}`);
    }
    // 保存群历史记录
    async saveHistory(groupid, qq, msg) {
      const key = `g-history${groupid}`;
      const history = (await cache.getCache(key)) || [];
      if (history.length >= historyLimit) {
        history.pop();
      }
      history.unshift({ userid: qq.toString(), msg, t: Date.now() });
      await cache.setCache(key, history, { ttl: 24 * 3600 });
      return history;
    }
  }
  return MyService;
};
