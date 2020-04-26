// 昵称插件，用于辅助记忆群友
'use strict';

const _ = require('lodash');

module.exports = app => {
  const db = app.qqDB;
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ selfid, user, isPrivate, history, group, cmd }, { raw_message }) {

      if (isPrivate) return null;
      // 判断是否询问群友
      const info = await this.checkAsk(raw_message, history);
      if (info) {
        return await this.replyWho(group.id, selfid, user.qq, info);
      }
      // 判断是否标记群友
      if (cmd.cmd === '设置昵称') {
        return await this.setNick(user.qq, group.id, history, cmd.params[0], cmd.params[1]);
      }
      return null;
    }
    // 心跳事件
    async onBeat() {
      return null;
    }
    // 检查是否在提问
    async checkAsk(msg, history) {
      const last = msg.length;

      let askType = 0;
      let who,
        nick;
      if (_.startsWith(msg, '谁是')) {
        askType = 1;
        nick = msg.substring(2, last);
        who = this.service.qqbot.groupmember.getPronous(nick, history);
        if (who) return who;
      }
      if (_.endsWith(msg, '是谁')) {
        askType = 2;
        nick = msg.substring(0, last - 2);
        who = this.service.qqbot.groupmember.getPronous(nick, history);
        if (who) return who;
      }
      return (askType > 0) ? { nick } : null;
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
    async answerOne(groupid, me, asker, { nick }, { qq, card, nickname, title }) {
      // 统计用户的昵称标记
      const names = {};
      let claim = null;
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
        if (!nick)nick = card || title || nickname;
      }

      let target;
      let pron;
      if (qq === me) {
        target = pron = '我';
      } else if (qq === asker) {
        target = pron = '你';
      } else {
        target = card || title || nickname;
        pron = '其';
      }
      if (target === nick && Math.random() < 0.66)target = ((card !== target) ? card : null) || ((title !== target) ? title : null) || nickname;

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
        const qq = cur.qq;
        let name;
        if (qq === me) {
          name = '我';
        } else if (qq === asker) {
          name = '你';
        } else {
          let name = await gm.getNick(qq, groupid);
          const { card, title, nickname } = cur;
          if (!name)name = card || title || nickname;
          if (name === who.nick) {
            name = ((card !== name) ? card : null) || ((title !== name) ? title : null) || nickname;
          }
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
    async setNick(uid, groupid, history, member, nick) {
      const gm = this.service.qqbot.groupmember;
      let { qq } = gm.getPronous(member, history);
      if (!qq) {
        qq = await gm.find(groupid, member, true);
        if (!qq) return { reply: `抱歉，我不知道${member}是谁`, at_sender: false };
      }
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
