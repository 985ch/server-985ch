// 基础插件
'use strict';

module.exports = app => {
  class MyService extends app.Service {
    // 处理消息
    async onMessage() {
      return null;
    }
    // 心跳事件
    async onBeat() {
      return null;
    }
  }
  return MyService;
};
