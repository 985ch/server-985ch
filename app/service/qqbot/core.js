// QQ机器人核心组件
'use strict';

module.exports = app => {
  class MyService extends app.Service {
    // 响应事件并处理
    async onEvent(raw) {
      const { post_type } = raw;
      switch (post_type) {
        case 'message': // 收到消息
          return await this.onMessage(raw);
        case 'notice': // 收到通知
          return await this.onNotice(raw);
        case 'request': // 收到请求
          return await this.onRequest(raw);
        default:
          break;
      }
      return {};
    }
    // 响应心跳事件
    async onBeat() {
      const bot = this.service.botplugin;
      for (const key in bot) {
        const cur = bot[key];
        if (cur.onBeat) await cur.onBeat();
      }
    }
    // 响应消息事件
    async onMessage(raw) {
      // 解析命令并获取个人和群组信息
      const msgInfo = await this.service.qqbot.data.messageInfo(raw);
      // 逐个模块处理信息，直到其中一个返回
      const bot = this.service.botplugin;
      for (const plugin of msgInfo.plugins) {
        const cur = bot[plugin];
        if (!cur.onMessage) continue;
        const result = await cur.onMessage(msgInfo);
        if (result) return result;
      }
      return {};
    }
    // 响应请求事件
    async onNotice(/* raw*/) {
      // TODO:在这里相应通知事件
      return { block: false };
    }
    // 响应请求事件
    async onRequest(/* raw*/) {
      // TODO：在这里响应加群请求或者好友请求
      return { block: false };
    }
  }
  return MyService;
};
