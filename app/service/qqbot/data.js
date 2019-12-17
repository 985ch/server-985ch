// QQ机器人消息处理组件
'use strict';

module.exports = app => {
  const plugins = app.config.qqbot.plugins;
  class MyService extends app.Service {
    // 解析消息，获取命令，用户和群信息并返回
    async messageInfo(raw) {
      const { message_type, user_id, raw_message, group_id, anonymous, sender } = raw;
      const self = this.ctx.get('X-Self-ID');
      if (user_id === self) return null; // 不处理自己发送的消息

      const user = await this.getUserData(user_id, group_id, anonymous, sender);
      const group = await this.service.qqbot.group.getData(group_id);
      const cmd = this.getCmd(raw_message);

      return {
        user,
        group,
        plugins: message_type === 'group' ? group.plugins : plugins,
        cmd,
      };
    }
    // 获取成员信息
    async getUserData(qq, groupid, anonymous, { nickname, card, role, level, title }) {
      const group = this.service.qqbot.group;
      if (anonymous) {
        return {
          qq: 0,
          nick: anonymous.name,
          title: '匿名者',
          level: 0,
          isAdmin: false,
          isOwner: false,
          roles: [],
          config: {},
        };
      }
      const user = await this.service.user.data.getByBot(qq);
      const nick = await group.getNick(qq, groupid);
      const isAdmin = role === 'admin';
      const isOwner = role === 'owner';
      if (groupid && !user.config.groupid) {
        user.config.groupid = groupid;
        await this.service.user.data.setConfig(qq, user.config, 'groupid', groupid);
      }
      return {
        qq: user.qq,
        nick: nick || card || nickname,
        title: title || isOwner ? '群主' : (isAdmin ? '管理员' : (groupid ? '群友' : '好友')),
        level,
        isAdmin,
        isOwner,
        roles: user.roles,
        config: user.config,
      };
    }

    // 解析命令行
    getCmd(text) {
      if (text.indexOf('-') !== 0) {
        return {};
      }
      let n = text.indexOf(' ');
      const nEnter = text.indexOf('\n');
      if (nEnter < n && nEnter >= 0) {
        n = nEnter;
      }
      return {
        cmd: text.substring(1, n > 0 ? n : undefined),
        rawParams: n >= 0 ? text.substring(n + 1) : '',
      };
    }
  }
  return MyService;
};
