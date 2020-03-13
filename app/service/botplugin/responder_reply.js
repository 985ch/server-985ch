// 复读机插件的回复组件
'use strict';

const maxRepeatLength = 100;
const defaultResponds = [
  '原来如此，我明白了',
  '好的，记下来了',
  '好像有点道理',
  '确实',
  '对啊，我也是这么想的',
];

module.exports = app => {
  const db = app.qqDB;
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, group, selfid, history, isPrivate }, { message }) {
      // 私聊和命令不参与复读
      if (isPrivate || !group.id || cmd.cmd) return null;
      const config = group.config;
      const repeater = config.repeater;

      const repeatCount = this.getCount(history, selfid, repeater);
      if (repeatCount > 0) { // 跟风复读
        const chance = 1 - 3 / ((repeatCount + 1) * (repeatCount + 1));
        if (Math.random() < chance) {
          return { reply: message, at_sender: false };
        }
      } else if (repeater.chance > 0 && Math.random() < repeater.chance) { // 随机应答
        if (this.checkRepeat(message) && Math.random() < repeater.repeat) {
          return { reply: message, at_sender: false };
        }
        return await this.randomReply(group.id);
      }
      return null;
    }
    // 心跳事件
    async onBeat() { return null; }
    // 当前内容的复读次数
    getCount(history, selfid, repeater) {
      if (repeater.follow === false) return 0;

      let repeatMsg = null; // 复读的内容
      let count = 0; // 内容出现次数
      let skip = 0; // 间隔的无关内容
      let lastUser = 0; // 下一句发言用户，同一个用户连续发言不会打断复读
      const members = [];
      for (const cur of history) {
        const { msg, userid } = cur;
        if (!repeatMsg) {
          repeatMsg = msg;
          members.push(userid);
        } else if (msg === repeatMsg) {
          if (userid === selfid) return 0;
          if (members.indexOf(userid) < 0) {
            count++;
            members.push(userid);
            skip = 0;
          }
        } else if (lastUser !== userid) { // 同一用户的连续发言不构成打断
          skip++;
          if (skip > 2) return count; // 连续打断超过2次视为复读中止
        }
        lastUser = userid;
      }
      return count;
    }
    // 判断是否符合复读条件
    checkRepeat(message) {
      let textCount = 0;
      let picCount = 0;
      for (let i = 0; i < message.length; i++) {
        const cur = message[i];
        if (cur.type === 'text') {
          textCount += cur.data.text.length;
        } else if (cur.type === 'image') {
          picCount++;
        } else if (cur.type === 'face' || cur.type === 'emoji' || cur.type === 'bface' || cur.type === 'sface') {
          textCount += 1;
        } else {
          return false;
        }
      }
      // 符合条件即复读
      if (textCount < maxRepeatLength && (picCount === 0 || (picCount === 1 && textCount > 2))) {
        return true;
      }
      return false;
    }
    // 从语句库中随机返回一个
    async randomReply(groupid) {
      const list = await db.Respond.simpleFind({ groupid }, [ 'text' ]);
      if (list.length <= 0) {
        return {
          reply: defaultResponds[Math.floor(Math.random() * defaultResponds.length)],
          at_sender: false,
        };
      }
      return {
        reply: list[Math.floor(Math.random() * list.length)].text,
        at_sender: false,
      };
    }
  }
  return MyService;
};
