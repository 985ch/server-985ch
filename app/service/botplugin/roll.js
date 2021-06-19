// 骰子组件
'use strict';

const _ = require('lodash');

module.exports = app => {
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, isPrivate, user, group }) {
      const groupid = isPrivate ? 0 : group.id;
      switch (cmd.cmd) {
        case 'roll':
          return this.rollDice(user, groupid, cmd.params[0], cmd.params[1]);
        case 'rd':
        case 'ra':
          return this.rollCheck(user, cmd.cmd, groupid, cmd.params[0], cmd.params[1]);
        case '抉择':
          return this.randomSelect(user, groupid, cmd.params);
        default:
          break;
      }
      return null;
    }
    // 心跳事件
    async onBeat() {
      return null;
    }
    // 掷骰子
    rollDice(user, groupid, action, diceText) {
      if (!diceText) {
        diceText = action;
        action = null;
      }
      diceText = (diceText || '1d100').toLowerCase();
      const { value, numbers, fail } = this.runDiceText(diceText);
      if (fail) return { reply: fail, at_sender: true };

      const nick = (groupid > 0) ? user.nick : '你';
      const text = numbers.length === 1 ? value.toString() : numbers.join('+') + '=' + value;
      return { reply: `${nick} ${action ? '骰[' + action + ']' : '掷骰子'}(${diceText}):${text}` };
    }
    // 拆解骰子指令并执行
    runDiceText(text) {
      const dices = text.toLowerCase().split('+');

      let count = 0;
      let value = 0;
      const numbers = [];
      for (let i = 0; i < dices.length; i++) {
        const diceInfo = dices[i].split('d');
        if (diceInfo.length === 1) {
          const n = Number.parseInt(diceInfo[0]);
          if (i === 0 || !_.isInteger(n)) return { fail: '无效的骰子格式' };
          if (i !== dices.length - 1) return { fail: '固定数字必须放在最后' };
          value += n;
          numbers.push(n);
        } else if (diceInfo.length === 2) {
          const diceCount = Number.parseInt(diceInfo[0]);
          const diceMax = Number.parseInt(diceInfo[1]);
          if (!_.isInteger(diceCount) || !_.isInteger(diceMax)) return { fail: '无效的骰子格式' };
          if (diceMax < 2 || diceMax > 100) return { fail: '骰子面数只能在2到100之间' };

          count += diceCount;
          if (count > 10) return { fail: '一次最多只能掷10个骰子' };

          for (let j = 0; j < diceCount; j++) {
            const n = Math.ceil(Math.random() * diceMax);
            value += n;
            numbers.push(n);
          }
        } else {
          return { fail: '无效的骰子格式' };
        }
      }
      return { value, numbers };
    }
    // 检定
    rollCheck(user, type, groupid, action, pass) {
      const max = (type === 'rd') ? 20 : 100;
      if (!pass) {
        pass = max / 2;
      } else {
        pass = Number.parseInt(pass);
        if (!_.isInteger(pass) || pass < 1 || pass > max) return { reply: '无效的检定值' };
      }
      const n = Math.ceil(Math.random() * max);
      const successText = (type === 'rd') ? this.getSuccessText(n === 1, n === 20, n >= pass) : this.getSuccessText(n === 100, n === 1, n <= pass);
      const nick = (groupid > 0) ? user.nick : '你';
      return { reply: `${nick} ${action ? '检定' + action : '掷检定'}:D${max}=${n}(${pass})${successText}` };
    }
    // 获取检定结果文本
    getSuccessText(bigFail, bigSuccess, success) {
      return bigFail ? '大失败' : bigSuccess ? '大成功' : success ? '成功' : '失败';
    }
    // 随机选择
    randomSelect(user, groupid, list) {
      if (!list || list.length === 0) return { reply: '没有选项' };
      if (list.length === 1) return { reply: '没有抉择的必要' };
      const text = list[Math.floor(Math.random() * list.length)];
      const nick = (groupid > 0) ? user.nick : '你';
      return { reply: `建议${nick}选择${text}` };
    }
  }
  return MyService;
};
