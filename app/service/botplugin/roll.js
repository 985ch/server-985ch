// 骰子组件
'use strict';

const _ = require('lodash');

module.exports = app => {
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, isPrivate, user, group }) {
      switch (cmd.cmd) {
        case 'roll':
          return this.rollDice(user, isPrivate ? null : group, cmd.params[0], cmd.params[1]);
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
    async rollDice(user, group, action, rollInfo) {
      if (!rollInfo) {
        rollInfo = action;
        action = null;
      }
      rollInfo = (rollInfo || '1d100').toLowerCase();
      const arr1 = rollInfo.split('d');
      if (arr1.length !== 2) {
        return { reply: '指令格式错误。正确格式：-roll [行为] (骰子数量)D(骰子面数)', at_sender: true };
      }
      const count = Number.parseInt(arr1[0]);
      const max = Number.parseInt(arr1[1]);
      if (!_.isNumber(count) || !_.isNumber(max)) {
        return { reply: '指令格式错误。正确格式：-roll [行为] (骰子数量)D(骰子面数)', at_sender: true };
      }
      if (count < 1 || count > 10) {
        return { reply: '骰子数量只能在1到10之间', at_sender: true };
      }
      if (max < 2 || max > 100) {
        return { reply: '骰子面数只能在2到100之间', at_sender: true };
      }

      let total = 0;
      const list = [];
      for (let i = 0; i < count; i++) {
        const n = Math.ceil(Math.random() * max);
        list.push(n);
        total += n;
      }

      let nick = '你';
      if (group && group.id > 0) {
        nick = user.nick;
      }
      return { reply: `${nick} ${action ? '骰[' + action + ']' : '掷骰子'}(${rollInfo}):${list.join('+')}=${total}` };
    }
  }
  return MyService;
};
