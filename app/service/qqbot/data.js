// QQ机器人消息处理组件
'use strict';

module.exports = app => {
  const plugins = app.config.qqbot.plugins;
  class MyService extends app.Service {
    // 获取群消息相关情报
    async groupMessageInfo(sender, messageChain) {
      const user = await this.getUserData(sender, sender.group);
      const group = await this.service.qqbot.group.getData(sender.group.id, sender.group.name);
      const cmd = this.getCmd(messageChain);

      return {
        user,
        group,
        isPrivate: false,
        plugins: group.plugins,
        cmd,
      };
    }
    // 获取私聊消息相关情报
    async privateMessageInfo(sender, messageChain) {
      const user = await this.getUserData(sender);
      let group = {
        id: 0,
        name: 'unknown',
        plugins: [],
        config: {},
      };
      if (user.config.groupid > 0) {
        group = await this.service.qqbot.group.getData(user.config.groupid);
      }
      const cmd = this.getCmd(messageChain);

      return {
        user,
        group,
        isPrivate: true,
        plugins,
        cmd,
      };
    }
    // 获取成员信息
    async getUserData(sender = {}, group = { id: 0 }) {
      const { id, memberName, nickname, permission } = sender;
      const gm = this.service.qqbot.groupmember;
      if (id === 80000000) {
        return {
          qq: 0,
          nick: memberName || nickname,
          isAdmin: false,
          isOwner: false,
          roles: [],
          config: { groupid: 0 },
        };
      }
      const user = await this.service.user.cache.getByQQ(id);

      let nick = null;
      if (nickname) {
        nick = nickname;
      } else {
        nick = await gm.getNick(id, group.id);
        if (nick === null)nick = memberName;
      }
      const isOwner = permission === 'OWNER';
      const isAdmin = permission === 'ADMINISTRATOR' || isOwner;

      if (group.id && !user.config.groupid) {
        user.config.groupid = group.id;
        await this.service.user.data.setConfig(id, user.config, 'groupid', group.id);
      }
      return {
        qq: user.qq,
        nick: nick || memberName,
        isAdmin,
        isOwner,
        roles: user.roles,
        config: user.config,
      };
    }
    // 解析命令
    getCmd(messageChain) {
      for (let i = 0; i < messageChain.length; i++) {
        if (messageChain[i].type === 'Plain') {
          const text = messageChain[i].text;
          if (text[0] !== '-') {
            return {};
          }
          let n = text.indexOf(' ');
          const nEnter = text.indexOf('\n');
          if (nEnter < n && nEnter >= 0) {
            n = nEnter;
          }
          const params = this.service.qqbot.cmd.readParams(text, n);
          return {
            cmd: text.substring(1, n > 0 ? n : undefined).toLowerCase(),
            chainIndex: i,
            params,
          };
        }
      }
      return {};
    }
  }
  return MyService;
};
