// QQ群数据管理组件
'use strict';

const _ = require('lodash');

const defaultPlugins = [ 'base' ].join(',');
const historyLimit = 50;

module.exports = app => {
  const cache = app.cache9.get('main');
  const memory = app.cache9.get('mem');
  const db = app.qqDB;
  class MyService extends app.Service {
    // 获取群数据
    async getData(groupid) {
      if (!groupid) {
        return {
          id: 0,
          name: 'unknown',
          plugins: [],
          config: {},
        };
      }
      const data = await memory.get(`g-data:${groupid}`, async () => {

        // 从酷Q或缓存获取群信息
        const groupInfo = await this.getInfo(groupid);

        // 从数据库获取群配置，并根据实际情况添加或者更新数据
        let dbData = await db.Groups.simpleFindOne({ id: groupid });
        if (!dbData) {
          const created = await db.Groups.create({
            id: groupInfo.group_id,
            name: groupInfo.group_name,
            plugins: defaultPlugins,
            config: '{}',
            active: 1,
          });
          dbData = db.Groups.filterAll(created.dataValues);
        } else if (dbData.name !== groupInfo.group_name) {
          await db.Groups.update({
            name: groupInfo.group_name,
            updatetime: Date.now(),
          }, {
            where: { id: groupid },
          });
        }
        return {
          id: groupid,
          name: groupInfo.group_name,
          plugins: dbData.active ? dbData.plugins : [],
          config: dbData.config,
        };
      }, { ttl: 3600 });
      return data;
    }
    // 获取群信息
    async getInfo(groupid) {
      return await memory.get(`g-info:${groupid}`, async () => {
        return await this.service.rpc.qqbot.getGroupInfo(groupid);
      }, { ttl: 24 * 3600 });
    }
    // 获取用户所属群ID
    async getUserGroup(qq, config) {
      let groupid = config.groupid;
      const success = await this.checkUserGroup(qq, groupid);
      if (success) return groupid;
      const groups = await this.getUserGroups(qq);
      if (groups.length > 0) {
        groupid = groups[0];
        await this.service.user.data.setConfig(qq, config, 'groupid', groupid);
        return groupid;
      }
      return 0;
    }
    // 获取群成员列表
    async getGroupMembers(groupid, update = false) {
      return await memory.get(`g-members:${groupid}`, async () => {
        const list = await this.service.rpc.qqbot.getGroupMemberList(groupid);
        const qq = {};
        const nickname = {};
        const card = {};
        const title = {};
        for (const member of list) {
          member.qq = member.user_id.toString();
          qq[member.qq] = member;
          this.ctx.helper.pushToObj(nickname, [ member.nickname ], member.qq);
          const showname = member.card || member.nickname;
          this.ctx.helper.pushToObj(card, [ showname ], member.qq);
          if (member.title) {
            this.ctx.helper.pushToObj(title, [ member.title ], member.qq);
          }
        }
        return { qq, card, nickname, title };
      }, { ttl: 1800, update });
    }
    // 获取群成员
    async getGroupMember(groupid, qq) {
      const members = await this.getGroupMembers(groupid);
      return members.qq[qq];
    }
    // 获取群列表
    async getGroupList() {
      return await memory.get('g-list', async () => {
        const list = await this.service.rpc.qqbot.getGroupList();
        return _.map(list, 'group_id');
      }, { ttl: 300 });
    }
    // 获取所有包含用户的群
    async getUserGroups(qq) {
      const groups = await this.getGroupList();
      const result = [];
      for (const groupid of groups) {
        const members = await this.getGroupMembers(groupid);
        if (members.qq.indexOf(qq))result.push(groupid);
      }
      return result;
    }
    // 检查用户是否属于某个群
    async checkUserGroup(qq, groupid) {
      let members = await this.getGroupMembers(groupid);
      if (members.qq.indexOf(qq) >= 0) {
        return true;
      }
      members = await this.getGroupMembers(groupid, true);
      return members.qq.indexOf(qq) >= 0;
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
    async saveHistory(groupid, userid, msgid, msg) {
      const key = `g-history${groupid}`;
      const history = (await cache.getCache(key)) || [];
      if (history.length >= historyLimit) {
        history.pop();
      }
      history.unshift({ msgid, userid: userid.toString(), msg, t: Date.now() });
      await cache.setCache(key, history, { ttl: 24 * 3600 });
      return history;
    }
  }
  return MyService;
};
