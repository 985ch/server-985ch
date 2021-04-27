// 昵称插件，用于辅助记忆群友
'use strict';

const _ = require('lodash');

module.exports = app => {
  const db = app.qqDB;
  const botCfg = app.config.qqbot;
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ user, isPrivate, history, group, cmd }, messageChain) {
      if (isPrivate) return null;
      // 判断是否询问群友
      const info = await this.checkAsk(messageChain, history);
      if (info) {
        return await this.replyWho(group.id, botCfg.qq, user.qq, info);
      }
      // 判断是否标记群友
      if (cmd.cmd === '设置昵称') {
        return await this.setNick(user.qq, group.id, messageChain, cmd);
      }
      return null;
    }
    // 心跳事件
    async onBeat() {
      return null;
    }
    // 检查是否在提问
    async checkAsk(msg, history) {
      if (msg.length === 2 && msg[0].type === 'At' && msg[1].type === 'Plain') {
        if ([ '是谁', ' 是谁', '是谁？', ' 是谁？' ].includes(msg[1].text)) {
          return { qq: msg[0].target };
        }
        return null;
      } else if (msg.length !== 1 || msg[0].type !== 'Plain') {
        return null;
      }

      const text = msg[0].text;
      const last = text.length;

      let askType = 0;
      let who,
        nick;
      if (_.startsWith(text, '谁是')) {
        askType = 1;
        nick = text.substring(2, last);
        who = this.getPronous(nick, history);
        if (who) return who;
      }
      if (_.endsWith(text, '是谁')) {
        askType = 2;
        nick = text.substring(0, last - 2);
        who = this.getPronous(nick, history);
        if (who) return who;
      }
      return (askType > 0) ? { nick } : null;
    }
    // 获取代词
    getPronous(nick, history) {
      switch (nick) {
        case '我':
          return { qq: history[0].userid };
        case '你':
        {
          if (history.length > 1) {
            return { qq: history[1].userid };
          }
          return { qq: botCfg.qq };
        }
        default:
          break;
      }
      return { nick };
    }
    // 回答我不知道
    idontknow({ nick }) {
      return { reply: `对啊，${nick || ''}到底是谁呢？`, at_sender: false };
    }
    // 回答成员
    async replyWho(groupid, me, asker, who) {
      const members = await this.getMembers(groupid, who);
      if (!members) return this.idontknow(who);
      if (_.isArray(members)) return await this.answerMany(groupid, me, asker, who, members);
      return await this.answerOne(groupid, me, asker, who, members);
    }
    // 查到单个成员，答复
    async answerOne(groupid, me, asker, { nick }, { id, memberName }) {
      // 统计用户的昵称标记
      const names = {};
      let claim = null;
      const qq = id.toString();
      const list = await db.Groupnick.simpleFind({ groupid, qq });
      for (const cur of list) {
        if (names[cur.nick]) {
          names[cur.nick]++;
        } else {
          names[cur.nick] = 1;
        }
        if (cur.addedUser === qq) { claim = cur.nick; }
      }

      // 拼接返回文本
      if (!nick) {
        nick = await this.service.qqbot.groupmember.getNick(qq, groupid);
        if (!nick)nick = memberName;
      }

      let target;
      let pron;
      if (qq === me) {
        target = pron = '我';
      } else if (qq === asker) {
        target = pron = '你';
      } else {
        target = memberName;
        pron = '其';
      }
      if (target === nick && Math.random() < 0.66)target = memberName;

      let reply = Math.random() < 0.5 ? `${target}就是${nick}` : `${nick}就是${target}`;
      if (nick === claim) {
        reply += `，${pron}如此自称`;
        if (names[nick] > 1) {
          reply += `并得到了${names[nick] - 1}个群友的认同`;
        }
      } else if (names[nick] > 0) {
        reply += `，共有${names[nick]}个群友这样认为`;
      }

      if (claim && claim !== nick) {
        reply += `\n${pron}自称${claim}${names[claim] > 1 ? `，并得到${names[claim] - 1}个网友的认同` : ''}`;
      }
      let plus = '';
      for (const name in names) {
        if (name !== claim && name !== nick) {
          plus += `${plus.length > 0 ? '，' : '\n此外'}还有${names[name]}个群友称${pron}为${name}`;
        }
      }
      if (plus)reply += plus;

      return { reply, at_sender: false };
    }
    // 查到多个成员，答复
    async answerMany(groupid, me, asker, who, members) {
      const gm = this.service.qqbot.groupmember;
      const list = [];
      for (const cur of members) {
        const qq = cur.id;
        let name;
        if (qq === me) {
          name = '我';
        } else if (qq.toString() === asker) {
          name = '你';
        } else {
          let name = await gm.getNick(qq, groupid);
          const { memberName } = cur;
          if (!name || name === who.nick)name = memberName;
        }
        list.push(name);
      }

      let reply;
      if (list.length === 2) {
        reply = `${who.nick}可能是${list.join('或者')}`;
      } else if (list.length === 3) {
        reply = `${who.nick}可能是${list[0]}，${list[1]}或者${list[2]}`;
      } else {
        reply = `${who.nick}可能是${list.join('，')}中的一个`;
      }
      return { reply, at_sender: false };
    }
    // 获取成员信息
    async getMembers(groupid, { qq, nick }) {
      // 从两种渠道获取用户QQ和群名片
      const members = await this.service.qqbot.group.getGroupMembers(groupid);
      if (qq) {
        return members.qq[qq];
      }
      const found = await this.service.qqbot.groupmember.find(groupid, nick, false);
      if (found.length <= 0) {
        return null;
      } else if (found.length === 1) {
        return members.qq[found[0]];
      }
      const result = _.map(found, cur => members.qq[cur]);
      return result.length > 0 ? result : null;
    }
    // 设置昵称
    async setNick(uid, groupid, msgs, cmd) {
      const gm = this.service.qqbot.groupmember;
      // 获取成员参数和昵称参数
      let member = cmd.params[0];
      let nick = cmd.params[1];
      if (cmd.chainIndex !== 0) {
        return { reply: '命令解析失败，请修正您的命令' };
      }
      if (msgs.length > 1) {
        if (msgs[1].type !== 'At') {
          return { reply: '命令解析失败，请修正您的命令' };
        }
        member = msgs[1].target;
        nick = cmd.params[0];
        if (!nick) {
          if (msgs.length < 3 || msgs[2].type !== 'Plain') {
            return { reply: '命令解析失败，请修正您的命令' };
          }
          nick = _.trim(msgs[2].text);
        }
      }
      // 确认设置目标
      const qq = await gm.find(groupid, member, true);
      if (!qq) return { reply: '目标识别失败，无法设置昵称', at_sender: false };
      if (!nick || nick.length === 0) return { reply: '昵称不可为空', at_sender: false };
      if (nick.length > 20) return { reply: '昵称太长，无法记录', at_sender: false };
      // 避免昵称重复
      const found = await db.Groupnick.simpleFindOne({
        groupid,
        [db.Sequelize.Op.or]: [
          { nick, qq: { [db.Sequelize.Op.ne]: qq } },
          { qq: nick },
        ],
      }, [ 'qq' ]);
      if (found) {
        const card = await gm.getCard(found.qq, groupid);
        return { reply: `称号 ${nick} 已被群友 ${card} 占用`, at_sender: false };
      }
      // 更新数据
      await gm.saveNick(uid, groupid, qq, nick);

      const card = await gm.getCard(qq, groupid);
      return { reply: `收到，已将 ${card} 标记为 ${nick}`, at_sender: false };
    }
  }
  return MyService;
};
