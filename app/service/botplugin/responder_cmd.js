// 复读机插件的命令处理组件
'use strict';

const _ = require('lodash');

const defaultChance = 0.01;
const defaultRepeat = 0.5;

const helpReply =
`复读机模块让bot可以像人类一样复读群友的发言，或者对群友发言做出随机回应：
-设置复读机权限 【级别】    群主可以通过该命令指定谁可以修改复读机设置，其有效值是【群主】和【狗管理】
-设置随机应答概率 【数值】    随机应答概率的有效范围在0到0.5之间
-设置复读权重 【数值】    复读权重的有效范围在0到1之间，该权重复读发言内容在随机应答中的比重
-开启跟风复读
-关闭跟风幅度
-复读机状态    该命令用于查看当前的复读机各项参数`;

module.exports = app => {
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, user, group, isPrivate }) {
      // 私聊和命令不参与复读
      if (isPrivate || !group.id) return null;
      const config = group.config;
      if (!config.repeater) {
        config.repeater = {
          chance: defaultChance,
          repeat: defaultRepeat,
          follow: true,
          auth: 'owner',
        };
      }
      switch (cmd.cmd) {
        case '设置复读机权限':
          return await this.setAuth(user, cmd, group);
        case '设置随机应答概率':
          return await this.setChance(user, cmd, group);
        case '设置复读权重':
          return await this.setRepeat(user, cmd, group);
        case '开启跟风复读':
          return await this.setFollow(user, true, group);
        case '关闭跟风复读':
          return await this.setFollow(user, false, group);
        case '复读机状态':
          return this.replyStatus(config.repeater);
        default:
          break;
      }
      return null;
    }
    // 心跳事件
    async onBeat() { return null; }
    // 帮助文本
    get helpText() { return helpReply; }
    // 检查权限
    checkAuth({ isOwner, isAdmin }, { repeater }) {
      return isOwner || (isAdmin && repeater.auth === 'admin');
    }
    // 设置复读机权限级别
    async setAuth({ isOwner }, cmd, { id, config }) {
      if (!isOwner) {
        return { reply: '只有群主才能这么做', at_sender: true };
      }
      const auth = cmd.params[0];
      if (auth === '群主') {
        config.repeater.auth = 'owner';
        this.service.qqbot.group.setConfig(id, config);
        return { reply: '群主已经把复读机的管理权限收回啦！', at_sender: false };
      } else if (auth === '狗管理') {
        config.repeater.auth = 'owner';
        this.service.qqbot.group.setConfig(id, config);
        return { reply: '群主已经把复读机的管理权限下放给诸位狗管理啦！', at_sender: false };
      }
      return {
        reply: '无法理解',
        at_sender: true,
      };
    }
    // 设置随机应答概率
    async setChance(user, cmd, { id, config }) {
      if (!this.checkAuth(user, config)) {
        return { reply: '没有权限', at_sender: true };
      }
      const chance = Number.parseFloat(cmd.params[0]);
      if (_.isNaN(chance) || chance < 0 || chance > 0.5) return { reply: '无效的概率', at_sender: true };
      config.repeater.chance = chance;
      this.service.qqbot.group.setConfig(id, config);

      return { reply: `应答概率已变更为${chance}`, at_sender: false };
    }
    // 设置复读权重
    async setRepeat(user, cmd, { id, config }) {
      if (!this.checkAuth(user, config)) {
        return { reply: '没有权限', at_sender: true };
      }
      const repeat = Number.parseFloat(cmd.params[0]);
      if (_.isNaN(repeat) || repeat < 0 || repeat > 1) return { reply: '无效的权重', at_sender: true };
      config.repeater.repeat = repeat;
      this.service.qqbot.group.setConfig(id, config);

      return { reply: `应答时的复读权重已变更为${repeat}`, at_sender: false };
    }
    // 设置跟风复读
    async setFollow(user, value, { id, config }) {
      if (!this.checkAuth(user, config)) {
        return { reply: '没有权限', at_sender: true };
      }
      config.repeater.follow = value;
      this.service.qqbot.group.setConfig(id, config);

      return { reply: `跟风复读已${value ? '开启' : '关闭'}`, at_sender: false };
    }
    // 返回复读机状态
    replyStatus({ chance, follow, auth, repeat }) {
      let reply = `当前应答概率为${chance}，应答时复读概率为${repeat}，`;
      if (follow === true) {
        reply += '跟风复读处于开启状态，';
      } else {
        reply += '跟风复读处于关闭状态，';
      }
      if (auth === 'admin') {
        reply += '所有管理员都可以修改这些设置。';
      } else {
        reply += '只有群主可以修改这些设置。';
      }
      return {
        reply,
        at_sender: false,
      };
    }
  }
  return MyService;
};
