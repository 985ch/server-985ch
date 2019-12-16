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
    // 响应消息事件
    async onMessage(/* raw*/) {
      // TODO：在这里响应消息并返回
      return {};
    }
    // 响应请求事件
    async onNotice(/* raw*/) {
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
