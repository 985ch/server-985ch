// QQ机器人消息处理组件
'use strict';

module.exports = app => {
  const plugins = app.config.qqbot.plugins;
  class MyService extends app.Service {
    // 解析消息，获取命令，用户和群信息并返回
    async groupMessageInfo(sender, messageChain) {
      const user = await this.getUserData(sender, sender.group);
      const group = await this.service.qqbot.group.getData(sender.group);
      const cmd = this.getCmd(messageChain);

      return {
        user,
        group,
        isPrivate: false,
        plugins: group.plugins,
        cmd,
      };
    }
    async privateMessageInfo(sender, messageChain) {
      const user = await this.getUserData(sender);
      const cmd = this.getCmd(messageChain);

      return {
        user,
        group: {
          id: 0,
          name: 'unknown',
          plugins: [],
          config: {},
        },
        isPrivate: true,
        plugins,
        cmd,
      };
    }
    // 获取成员信息
    async getUserData(sender = {}, group = { id: 0 }) {
      const { id, memberName, permission } = sender;
      const gm = this.service.qqbot.groupmember;
      if (id === 80000000) {
        return {
          qq: 0,
          nick: memberName,
          title: '匿名者',
          isAdmin: false,
          isOwner: false,
          roles: [],
          config: {},
        };
      }
      const user = await this.service.user.cache.getByQQ(id);

      let nick = await gm.getNick(id, group.id);
      if (nick === null)nick = card || nickname;
      const isOwner = permission === 'OWNER';
      const isAdmin = permission === 'ADMINISTRATOR' || isOwner;

      if (group.id && !user.config.groupid) {
        user.config.groupid = group.id;
        await this.service.user.data.setConfig(qq, user.config, 'groupid', groupid);
      }
      return {
        qq: user.qq,
        nick: nick || card || nickname,
        title: title || isOwner ? '群主' : (isAdmin ? '管理员' : (group.id ? '群友' : '好友')),
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
      let params = null;
      const cmd = this.service.qqbot.cmd;
      return {
        cmd: text.substring(1, n > 0 ? n : undefined).toLowerCase(),
        get params() {
          if (params) return params;
          params = cmd.readParams(text, n);
          return params;
        },
      };
    }
  }
  return MyService;
};
