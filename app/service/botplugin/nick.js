// 昵称插件，用于辅助记忆群友
'use strict';
// 询问命令模板
const askTesters = [
  {
    regular: /我是谁/,
    getData(s, qq) { return { qq }; },
  },
  {
    regular: /\[CQ:at,qq=[\d]+\]是谁/,
    getData(s) { return { qq: s.substring(10, s.length - 3) }; },
  },
  {
    regular: /谁是\[CQ:at,qq=[\d]+\]/,
    getData(s) { return { qq: s.substring(12, s.length - 1) }; },
  },
  {
    regular: /[\S]+是谁/,
    getData(s) { return { text: s.substring(0, s.length - 2) }; },
  },
  {
    regular: /谁是[\S]+/,
    getData(s) { return { text: s.substring(2, s.length) }; },
  },
];
// 记忆命令模板
const rememberTesters = [
  {
    regular: /\[CQ:at,qq=[\d]+\]是[\S]+/,
    getData(s) {
      const n = s.indexOf(']', 10);
      return {
        qq: s.substring(10, n),
        nick: s.substring(n + 2),
      };
    },
  },
  {
    regular: /我(是|就是|便是|即是)[\S]+/,
    getData(s, qq) {
      return {
        qq,
        nick: s.substring(2),
      };
    },
  },
];

module.exports = app => {
  const db = app.qqDB;
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, user, isPrivate, group }, { raw_message }) {
      if (isPrivate || cmd.cmd) return null;
      // 判断是否询问群友
      const member = this.check(raw_message, askTesters);
      if (member) {
        return await this.replyWho(group.id, user.qq, member);
      }
      // 判断是否标记群友
      const data = this.check(raw_message, rememberTesters);
      if (member) {
        return await this.remember(user.qq, group.id, data.qq, data.nick);
      }
      return null;
    }
    // 心跳事件
    async onBeat() {
      return null;
    }
    // 检查并在检查成功时返回数据
    check(raw, list) {
      for (const cur of list) {
        if (cur.regular.test(raw)) {
          return cur.getData(raw);
        }
      }
      return null;
    }
    // 回答成员
    async replyWho(groupid, self, member) {
      let { card, qq, text } = this.getMember(groupid, member);
      if (!qq) return { reply: `未查到群友:${text}，请确认该群友是否存在并已被标记`, at_sender: false };

      // 统计用户的昵称标记
      const names = {};
      let selfname = null;
      const list = await db.simpleFind({ groupid, qq });
      for (const cur of list) {
        const nick = cur.nick;
        if (names[nick]) {
          names[nick]++;
        } else {
          names[nick] = 1;
        }
        if (cur.addedUser === qq) { selfname = nick; }
      }

      // 拼接返回文本
      let target = '该群友';
      if (self === qq) {
        card = '你';
        target = '你';
      }
      let reply = `${card} 就是 ${text}`;
      if (selfname === text) {
        reply += `，${target}如此自称`;
        if (names[text] > 1) {
          reply += `并得到了${names[text] - 1}个群友的支持\n`;
        }
      } else if (names[text] > 0) {
        reply += `共有${names[text]}个群友支持这个称号\n`;
      }
      if (selfname && selfname !== text) {
        reply += `${target}自称 ${selfname}${names[selfname] > 1 ? `并得到${names[selfname] - 1}个网友的支持` : ''}\n`;
      }
      reply += '此外';
      for (const name in names) {
        if (name !== selfname && name !== text) {
          reply += `，有${names[name]}个群友称${self === qq ? '你' : '其'}为 ${name}`;
        }
      }

      return { reply, at_sender: false };
    }
    // 获取成员信息
    async getMember(groupid, { qq, text }) {
      // 从两种渠道获取用户QQ和群名片
      let card = null;
      if (!qq) {
        const found = await this.service.qqbot.group.getMember(groupid, text);
        if (!found) return {};
        qq = found.qq;
        card = found.card || found.nickname;
      } else {
        const members = await this.service.qqbot.group.getMembers(groupid);
        const member = members.qq[qq] || {};
        card = member.card || member.nickname || qq;
        text = card;
        if (card === text) card = member.title || card; // 群名片为查找文本时优先返回头衔
      }
      return { qq, text, card };
    }
    // 记忆成员
    async remember(addedUser, groupid, qq, nick) {
      const group = this.service.qqbot.group;
      // 去掉末尾的标点符号
      if ('!！?？.。'.indexOf(nick[nick.length - 1]) >= 0) {
        nick = nick.substring(0, nick.length - 1);
      }
      // 避免昵称重复

      const found = await db.simpleFindOne({ groupid, nick, qq: { [db.Op.ne]: qq } }, [ 'qq' ]);
      if (found) {
        const card = await group.getCard(found.qq, groupid);
        return { reply: `称号 ${nick} 已被群友 ${card} 占用`, at_sender: false };
      }
      // 更新数据
      await group.saveNick(addedUser, groupid, qq, nick);

      const card = await group.getCard(qq, groupid);
      return { reply: `收到，已将 ${card} 标记为 ${nick}`, at_sender: false };
    }
  }
  return MyService;
};
