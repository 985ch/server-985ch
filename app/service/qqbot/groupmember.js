// 群成员身份解析
'use strict';

const _ = require('lodash');

module.exports = app => {
  const memory = app.cache9.get('mem');
  const db = app.qqDB;
  class MyService extends app.Service {
    // 获取代词
    getPronous(raw, history) {
      if (raw === '我') {
        return { qq: history[0].userid, raw };
      }
      if ((raw === '你') && history.length > 1) {
        if (history.length < 2) return { qq: this.ctx.get('X-Self-ID'), raw };
        return { qq: history[1].userid, raw };
      }
      const temp = _.trim(raw);
      if (_.startsWith(temp, '[CQ:at,qq=')) {
        if (temp.indexOf(']', 10) === temp.length - 1) {
          return { qq: temp.substring(10, temp.length - 1), raw };
        }
        return {};
      }
      return { nick: raw, raw };
    }
    // 获取群昵称
    async getNick(qq, groupid) {
      if (!groupid) return null;
      return await memory.get(`gm-nick:${qq}:${groupid}`, async () => {
        const result = await db.Groupnick.findOne({
          attributes: [ 'nick', [ db.fn('SUM', db.col('score')), 'sum' ]],
          where: {
            groupid,
            qq,
          },
          group: 'nick',
          order: [[ db.fn('SUM', db.col('score')), 'desc' ]],
          raw: true,
        });
        return result ? result.nick : null;
      }, { ttl: 600 });
    }
    // 获取群卡片
    async getCard(qq, groupid) {
      const members = await this.service.qqbot.group.getGroupMembers(groupid);
      const member = members.qq[qq] || {};

      return member.card || member.nickname || qq;
    }
    // 获取群昵称或群卡片
    async getNickOrCard(qq, groupid) {
      const nick = await this.getNick(qq, groupid);
      if (nick) return nick;
      return await this.getCard(qq, groupid);
    }
    // 获取群成员QQ号
    async find(groupid, nick, onlyOne = true) {
      const { card, nickname, title } = await this.service.qqbot.group.getGroupMembers(groupid);
      const foundMember = await memory.get(`gm-names:${groupid}:${nick}`, async () => {
        const found = await db.Groupnick.simpleFindOne({
          groupid,
          [db.Sequelize.Op.or]: [
            { nick },
            { qq: nick },
          ],
        }, [ 'qq' ]);
        return found ? found.qq : null;
      }, { ttl: 300 });
      if (foundMember && onlyOne) return foundMember;

      let all;
      if (onlyOne) {
        all = card[nick] || nickname[nick] || title[nick];
        return all ? all[0] : null;
      }
      all = _.union(foundMember ? [ foundMember ] : [], card[nick], nickname[nick], title[nick]);
      return all;
    }
    // 根据语境处理代词
    async getMember(text, groupid, history) {
      const { qq, nick } = this.getPronous(text, history);
      if (qq) return qq;
      if (nick) return await this.find(groupid, nick);
      return null;
    }
    // 设置群友昵称
    async saveNick(addedUser, groupid, qq, nick) {
      const score = addedUser === qq ? 3 : 1;
      await db.Groupnick.upsert({ groupid, qq, nick, addedUser, score });
      await memory.clear(`gm-nick:${qq}:${groupid}`);
    }
  }
  return MyService;
};
