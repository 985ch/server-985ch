// QQ机器人消息处理组件
'use strict';

module.exports = app => {
  class MyService extends app.Service {
    // 解析消息，获取命令，用户和群信息并返回
    async getInfo(/* raw*/) {
      // 获取用户信息，若缓存中查不到用户则从数据库查找或添加
      // 获取群信息，若缓存中查不到则从数据库查找或添加
      // 解析命令文本
      return null;
    }
  }
  return MyService;
};
