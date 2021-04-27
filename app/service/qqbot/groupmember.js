// 群成员身份解析
'use strict';

const _ = require('lodash');

module.exports = app => {
  const memory = app.cache9.get('mem');
  const db = app.qqDB;
  class MyService extends app.Service {
    // 获取群名片
    async getCard(qq, groupid) {
      const members = await this.service.qqbot.group.getGroupMembers(groupid);
      return members.qq[qq] && members.qq[qq].memberName;
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
    // 获取群成员QQ号
    async find(groupid, nick, onlyOne = true) {
      const { qq, nickname } = await this.service.qqbot.group.getGroupMembers(groupid);
      const groupResult = qq[nick] ? nickname[qq[nick].memberName] : nickname[nick];
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
      if (foundMember && onlyOne) return _.map(foundMember, 'qq');

      let all;
      if (onlyOne) {
        all = groupResult;
        return all ? all[0] : null;
      }
      all = _.union(foundMember ? [ foundMember ] : [], groupResult);
      return all;
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
