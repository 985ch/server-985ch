// 命令解析脚本
'use strict';

module.exports = app => {
  class MyService extends app.Service {
    // 转译消息为标准格式
    transMessage(raw) {
      return (typeof raw !== 'string') ? raw : [{ type: 'Plain', text: raw }];
    }
    // 发送群消息
    async sendGroupMessage({ group }, message, quote) {
      // TODO:处理被禁言状态
      return await this.service.rpc.mirai.sendGroupMessage(group.id, message, quote);
    }
    // 发送私信
    async sendPrivateMessage({ group, id }, message, quote) {
      if (group) {
        return await this.service.rpc.mirai.sendTempMessage(group.id, id, message, quote);
      }
      return await this.service.rpc.mirai.sendFriendMessage(group.id, id, message, quote);
    }
  }
  return MyService;
};
