// 基础插件
'use strict';

const defaultResponds = [
  '是的，我在',
  '不在哦',
  '您好，请问需要什么帮助吗？',
  'bot是谁？',
  '找我有什么事？',
];

module.exports = app => {
  const webUrl = app.config.webUrl;
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, user, isPrivate }) {
      if (!isPrivate) return null;
      switch (cmd.cmd) {
        case '登陆':
        case '登录':
          return await this.login(user.qq);
        case 'bot在不在':
          return { reply: defaultResponds[Math.floor(Math.random() * defaultResponds.length)] };
        case '命令':
          if (user.roles.includes('admin')) {
            const params = cmd.params;
            const name = params.shift();
            const reply = await this.service.rpc.mirai.sendCommand(name, params);
            return { reply };
          }
          break;
        default:
          break;
      }
      return null;
    }
    // 心跳事件
    async onBeat() {
      return null;
    }
    // 生成登陆信息并返回
    async login(qq) {
      const code = await this.service.user.data.genCode(qq);
      const reply = `点击链接登陆：${webUrl}/#/login?qq=${qq}&code=${code}\n您也用一次性密码${code}手动登陆，密码有效时间5分钟。`;
      return {
        reply,
      };
    }
  }
  return MyService;
};
