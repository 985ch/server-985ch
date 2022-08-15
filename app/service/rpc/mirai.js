// 对接QQ机器人
'use strict';

const _ = require('lodash');
const { MiraiError } = require('../../../lib/errors');

module.exports = app => {
  const cache = app.cache9.get('main');
  const botCfg = app.config.qqbot;
  class MyService extends app.Service {
    // 请求mirai服务器
    async requestMirai(method, api, params) {
      const sessionKey = await this.getSession();
      const data = _.extend({ sessionKey }, params);

      const res = await this.ctx.curl(botCfg.url + api, {
        method,
        data: method === 'POST' ? JSON.stringify(data) : data,
      });
      if (res.status !== 200) throw new MiraiError(res.status, -1, api);

      const result = JSON.parse(res.data.toString());
      if (result.code === 3 || result.code === 4) {
        cache.clear('mirai:session');
        return await this.requestMirai(method, api, params);
      }

      return result;
    }
    // 认证并激活session
    async getSession() {
      return await cache.get('mirai:session', async () => {
        const res = await this.ctx.curl(botCfg.url + '/verify', { method: 'POST', data: JSON.stringify({ verifyKey: botCfg.authKey }) });
        if (res.status !== 200) throw new MiraiError(res.status, -1, '/verify');
        const resData = JSON.parse(res.data.toString());
        if (resData.code !== 0) throw new MiraiError(res.status, resData.code, '/verify');
        const session = resData.session;
        const res2 = await this.ctx.curl(botCfg.url + '/bind', {
          method: 'POST',
          data: JSON.stringify({
            sessionKey: session,
            qq: botCfg.qq,
          }),
        });
        if (res2.status !== 200) throw new MiraiError(res2.status, -1, '/bind');
        const resData2 = JSON.parse(res2.data.toString());
        if (resData2.code !== 0) throw new MiraiError(res2.status, resData2.code, '/bind');
        return session;
      }, { ttl: 24 * 3600, autoRenew: true });
    }
    // 拉取最新获得的信息
    async fetchMessage(count = 99) {
      let list = [];
      await app.redlock9.run('mirai-fetchMsg', 1000, async () => {
        const res = await this.requestMirai('GET', '/fetchMessage', { count });
        list = res.data;
      });
      return list;
    }
    // 发送同意或者拒绝入群邀请的应答
    async replyInvitedJoinGroup({ groupId, eventId, fromId } = {}, allow = false) {
      await this.requestMirai('POST', '/resp/botInvitedJoinGroupRequestEvent', {
        eventId,
        fromId,
        groupId,
        operate: allow ? 0 : 1,
        message: '',
      });
    }
    // 发送同意或者拒绝加为好友的应答
    async replyNewFriendRequest({ groupId, eventId, fromId } = {}, allow = false) {
      await this.requestMirai('POST', '/resp/newFriendRequestEvent', {
        eventId,
        fromId,
        groupId,
        operate: allow ? 0 : 1,
        message: '',
      });
    }
    // 发送群消息
    async sendGroupMessage(group, message, quote) {
      const data = { group, messageChain: message };
      if (quote)data.quote = quote;
      const result = await this.requestMirai('POST', '/sendGroupMessage', data);
      return result.messageId;
    }
    // 发送好友消息
    async sendFriendMessage(qq, message, quote) {
      const data = { qq, messageChain: message };
      if (quote)data.quote = quote;
      const result = await this.requestMirai('POST', '/sendFriendMessage', data);
      return result.messageId;
    }
    // 发送临时会话消息
    async sendTempMessage(group, qq, message, quote) {
      const data = { group, qq, messageChain: message };
      if (quote)data.quote = quote;
      const result = await this.requestMirai('POST', '/sendTempMessage', data);
      return result.messageId;
    }
    // 获取群列表
    async groupList() {
      const res = await this.requestMirai('GET', '/groupList');
      return res.data;
    }
    // 获取群成员列表
    async memberList(groupid) {
      return await this.requestMirai('GET', '/memberList', { target: groupid });
    }
    // 获取群成员信息
    async memberInfo(groupid, qq) {
      return await this.requestMirai('GET', '/memberInfo', { target: groupid, memberid: qq });
    }
    // 发送指令
    async sendCommand(name, args) {
      const data = {
        authKey: botCfg.authKey,
        name: '/' + name,
        args,
      };

      const res = await this.ctx.curl(botCfg.url + '/command/send', {
        method: 'POST',
        data: JSON.stringify(data),
      });
      if (res.status !== 200) throw new MiraiError(res.status, -1, '/command/send');

      return res.data.toString();
    }
  }
  return MyService;
};
