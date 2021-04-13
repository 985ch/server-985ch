// 对接QQ机器人
'use strict';

const _ = require('lodash');
const { MiraiError } = require('../../../lib/errors');

let sessionKey = null;

module.exports = app => {
  const botCfg = app.config.qqbot;
  class MyService extends app.Service {
    // 请求mirai服务器
    async requestMirai(method, api, params) {
      await this.getSession();
      const data = _.extend({ sessionKey }, params);

      const res = await this.ctx.curl(botCfg.url + api, {
        method,
        data: method === 'POST' ? JSON.stringify(data) : data,
      });
      if (res.status !== 200) throw new MiraiError(res.status, -1, api);

      const result = JSON.parse(res.data.toString());
      if (result.code === 3 || result.code === 4) {
        sessionKey = null;
        return await this.requestMirai(method, api, params);
      }

      return result;
    }
    // 认证并激活session
    async getSession() {
      if (sessionKey) return;

      const res = await this.ctx.curl(botCfg.url + '/auth', { method: 'POST', data: JSON.stringify({ authKey: botCfg.authKey }) });
      if (res.status !== 200) throw new MiraiError(res.status, -1, '/auth');
      const resData = JSON.parse(res.data.toString());
      if (resData.code !== 0) throw new MiraiError(res.status, resData.code, '/auth');
      const session = resData.session;
      const res2 = await this.ctx.curl(botCfg.url + '/verify', {
        method: 'POST',
        data: JSON.stringify({
          authKey: botCfg.authKey,
          sessionKey: session,
          qq: botCfg.qq,
        }),
      });
      if (res2.status !== 200) throw new MiraiError(res2.status, -1, '/verify');
      const resData2 = JSON.parse(res2.data.toString());
      if (resData2.code !== 0) throw new MiraiError(res2.status, resData2.code, '/verify');
      sessionKey = session;
    }
    // 拉取最新获得的信息
    async fetchMessage(count = 99) {
      const res = await this.requestMirai('GET', '/fetchMessage', { count });
      return res.data;
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
  }
  return MyService;
};
