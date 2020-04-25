// PCR团战助手
'use strict';

const _ = require('lodash');

const levels = [ '阶段一', '阶段二', '阶段三', '阶段四' ];
const levelLoop = [ 0, 3, 10, 34 ];

const defaultData = {
  loop: 0, // 团战周目
  lv: 0, // 团战阶段
  cur: { id: 0, hp: 6000000 }, // 当前BOSS和血量
  // 五个BOSS的别名和各阶段最大血量
  boss: [
    { alias: [ '老一' ], hp: [ 6000000, 6000000, 7000000, 7000000 ] },
    { alias: [ '老二' ], hp: [ 8000000, 8000000, 9000000, 9000000 ] },
    { alias: [ '老三' ], hp: [ 10000000, 10000000, 13000000, 13000000 ] },
    { alias: [ '老四' ], hp: [ 12000000, 12000000, 15000000, 15000000 ] },
    { alias: [ '老五' ], hp: [ 15000000, 15000000, 20000000, 20000000 ] },
  ],
  fighting: [], // 正在出刀的人，包括QQ号qq，队伍名称team，和申请出刀时间time
  tree: [], // 挂树的人，数据内容同上
  log: [], // 出刀记录，包括QQ号qq，出刀次数count, 每个队的伤害记录 damage:['甜心刀(老三：1000)'}]
  log_yestoday: [], // 前一日的出刀记录
  offset: 5 * 60 * 60 * 1000, // 换日时间，根据日服和国服有所不同
  t: 0, // 时间戳，如果上次时间戳和这次时间戳有差异则出刀记录等都清零
};

const helpText = `团战小助手是用于记录PCR团战数据的小工具，由于数据都是人工录入，所以在工会成员不按要求录入数据的情况下会出现数据错误的情况。因此不建议太过依赖该工具。
 团战小助手命令说明：
-团战状态           查看当前团战的状态
-出刀记录           查看本日出刀的记录
-开始出刀 【队名】   告诉bot你即将出刀，为了便于记忆请输入出刀的队名，例如“物理一队”，“魔法一队”，“甜心刀”等
-放弃出刀           告诉bot，你虽然刚才说你要出刀，但是你放弃了。注意，放弃出刀是指次数没减少而且没有上树的情况，凡是打了就不算放弃出刀
-完成出刀 【伤害值】 告诉bot你的一刀已经打完了。注意，打完是指一个队伍已经用完，不会继续用这个队伍战斗的情况
-挂树 【伤害值】     告诉bot你已经挂到树上了。挂树是指你当前的队伍被锁死，并且次数没有用完，下一场战斗无法选择其他队伍的情况
-报告BOSS状态 【名字】 【剩余血量】   人工修改BOSS当前的状态。由于各种原因导致bot储存的当前状态和游戏里的数据不符的时候，可以用这个命令来校正数据
-报告团战周目 【当前周目】  人工修改当前团战的周目。由于各种原因导致bot显示的当前周目和游戏中不符的时候，可以用这个命令来校正数据
-设置PCR服务器 【服务器】   设置当前群所属的PCR服务器，服务器应该是“日服”或者“国服”中的一个。该选项决定了bot每天在几点钟的时候清空当日数据
-设置BOSS别名 【原名字】 【新名字】  为了方便操作和现实，给BOSS设置别名。BOSS的默认名字为“老一”到“老五”。
-设置BOSS血量 【名字】 【阶段】 【血量】  人工设置BOSS在某个阶段的最大血量。在当前设置的血量和游戏中实际血量不符的时候使用。
-确认BOSS血量 【阶段】 查看所有BOSS在某个阶段的血量，用于确认数据是否正确。

*【阶段】参数的有效值是“阶段一”“阶段二”“阶段三”“阶段四”
`;

module.exports = app => {
  const cache = app.cache9.get('main');

  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, user, group, isPrivate }) {
      if (cmd.cmd === '关于团战小助手' && isPrivate) return { reply: helpText };
      if (isPrivate) return null;
      switch (cmd.cmd) {
        case '团战状态': // 查看当前团战状态
          return await this.status(group.id);
        case '出刀记录': // 查看本日出刀汇报情况
          return await this.showLog(group.id);
        case '开始出刀': // -开始出刀 队名
          return await this.startFight(group.id, user.qq, cmd.params[0]);
        case '放弃出刀': // 放弃出刀
          return await this.skipFight(group.id, user.qq);
        case '完成出刀': // -完成出刀 100000
          return await this.completeFight(group.id, user.qq, Number.parseInt(cmd.params[0]));
        case '挂树': // -挂树 100000
          return await this.hangTree(group.id, user.qq, Number.parseInt(cmd.params[0]));
        case '报告BOSS状态': // -汇报BOSS状态 老三 10000
          return await this.setBossStatus(group.id, cmd.params[0], Number.parseInt(cmd.params[1]));
        case '报告团战周目': // -设置团战周目 1
          return await this.setLoop(group.id, Number.parseInt(cmd.params[0]));
        case '设置PCR服务器': // -设置PCR服务器 日服
          if (!user.isAdmin) return { reply: '没有权限，请让管理员代为设置' };
          return await this.setServer(group.id, cmd.params[0]);
        case '设置BOSS别名': // -设置BOSS别名 老一 龙
          if (!user.isAdmin) return { reply: '没有权限，请让管理员代为设置别名' };
          return await this.setBossAlias(group.id, cmd.params[0], cmd.params[1]);
        case '设置BOSS血量': // -设置BOSS血量 老一 一阶段 1000000
          if (!user.isAdmin) return { reply: '没有权限，请让管理员代为设置血量' };
          return await this.setBossHP(group.id, cmd.params[0], cmd.params[1], Number.parseInt(cmd.params[2]));
        case '确认BOSS血量': // -确认BOSS血量 一阶段
          return await this.showBossHP(group.id, cmd.params[0]);
        default:
          break;
      }
      return null;
    }
    // 判断是否属于同一天
    diffrentData(time1, time2, offset) {
      const d1 = new Date(time1 - offset);
      const d2 = new Date(time2 - offset);
      return d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    }
    // 获取团战数据
    async getData(groupid) {
      let data = await cache.getCache('pcrhelper:' + groupid);
      const now = (new Date()).getTime();
      if (!data) {
        data = _.cloneDeep(defaultData);
        data.t = now;
      }
      if (this.diffrentDate(now, data.t, data.offset)) {
        data.fighting = [];
        data.tree = [];
        data.log_yestoday = data.log;
        data.log = [];
      }
      data.t = now;

      return data;
    }
    // 保存团战数据
    async saveData(groupid, data) {
      await cache.setCache('pcrhelper:' + groupid, data, { ttl: 7 * 24 * 3600 });
    }
    // 设置团战数据
    async setData(groupid, key, value) {
      const data = await this.getData(groupid);
      data[key] = value;
      await cache.setCache('pcrhelper:' + groupid, data, { ttl: 7 * 24 * 3600 });
    }
    // 获取团战状态
    async status(groupid) {
      const { loop, lv, cur, boss, fighting, tree } = await this.getData(groupid);

      if (!boss[lv]) return { reply: `管理员尚未设置${levels[lv]}的BOSS血量，无法查看团战状态`, at_sender: false };

      const gm = this.service.qqbot.groupmember;
      let reply = `当前BOSS状态：${loop + 1}周目 ${levels[lv]} ${boss[cur.id].alias[0]}  ${cur.hp}/${boss[cur.id].hp[lv]}\n`;
      const fighters = [];
      for (const fighter of fighting) {
        const nick = await gm.getNick(fighter.qq, groupid);
        fighters.push(`${nick} ${fighter.team} ${fighter.time}\n`);
      }
      if (fighters.length > 0)reply += '正在出刀：\n' + fighters.join('\n');

      const treemen = [];
      for (const treeman of tree) {
        const nick = await gm.getNick(treeman.qq, groupid);
        treemen.push(`${nick} ${treeman.team} ${treeman.time}\n`);
      }
      if (treemen.length > 0)reply += '还在树上：\n' + treemen.join('\n');

      return { reply, at_sender: false };
    }
    // 获取本日出刀记录
    async showLog(groupid) {
      const gm = this.service.qqbot.groupmember;
      const { log } = await this.getData(groupid);
      const logs = [];
      for (const cur of log) {
        const nick = await gm.getNick(cur.qq, groupid);
        logs.push(`${nick} 已出${cur.count}刀 队伍：${cur.damage.join(' ')}`);
      }
      if (logs.length > 0) {
        return { reply: logs.join('\n'), at_sender: false };
      }
      return { reply: '本日暂无出刀记录', at_sender: false };
    }
    // 设置服务器
    async setServer(groupid, server) {
      switch (server) {
        case '日服':
          await this.setData(groupid, 'offset', 4 * 60 * 60 * 1000);
          break;
        case '国服':
          await this.setData(groupid, 'offset', 5 * 60 * 60 * 1000);
          break;
        default:
          return { reply: '无效的参数，参数应是“日服”或者“国服”中的一个' };
      }
      return { reply: '设置完成', at_sender: false };
    }
    // 根据名字获得boss的id
    findBoss(boss, nick) {
      return _.findIndex(boss, obj => obj.alias.includes(nick));
    }
    // 设置BOSS别名
    async setBossAlias(groupid, oldNick, newNick) {
      if (!oldNick || !newNick) {
        return { reply: '无效的参数，请分别输入BOSS原来的别名和新别名' };
      }

      const data = await this.getData(groupid);
      const id = this.findBoss(data.boss, oldNick);
      if (id < 0) return { reply: '设置别名失败，无法找到目标BOSS', at_sender: false };
      if (this.findBoss(data.boss, newNick)) return { reply: '设置别名失败，和现有的BOSS发生重名', at_sender: false };

      data.boss[id].alias.unshift(newNick);
      await this.saveData(groupid, data);

      return { reply: `设置成功，${oldNick} 获得了新的别名 ${newNick}`, at_sender: false };
    }
    // 设置BOSS血量
    async setBossHP(groupid, nick, level, hp) {
      const lv = levels.indexOf(level);
      if (lv < 0 || !nick || !_.isInteger(hp) || hp < 99) {
        return { reply: '无效的参数，请确认参数是否正确' };
      }

      const data = await this.getData(groupid);
      const id = this.findBoss(data.boss, nick);
      if (id < 0) return { reply: '设置别名失败，无法找到目标BOSS', at_sender: false };

      data.boss[id].hp[lv] = hp;
      await this.saveData(groupid, data);

      return { reply: `设置成功，${level} ${nick} 的血量上限已修改为 ${hp}`, at_sender: false };
    }
    // 确认BOSS血量
    async showBossHP(groupid, level) {
      const lv = levels.indexOf(level);
      if (lv < 0) return { reply: '无效的阶段，请确认参数是否正确' };

      const data = await this.getData(groupid);
      const list = _.map(data.boss, cur => `${cur.alias[0]}:${cur.hp[lv]}`);
      return { reply: `${level}各个BOSS血量如下：\n${list.join('\n')}`, at_sender: false };
    }
    // 设置BOSS状态
    async setBossStatus(groupid, nick, hp) {
      if (!nick || !_.isInteger(hp)) return { reply: '无效的参数，请确认参数是否正确' };

      const data = await this.getData(groupid);
      const id = this.findBoss(data.boss, nick);
      if (id < 0) return { reply: '设置别名失败，无法找到目标BOSS', at_sender: false };

      data.cur = { id, hp };
      await this.saveData(groupid, data);

      return { reply: `已记录当前BOSS状态为：${nick} ${hp}/${data.boss[id].hp[data.lv]}`, at_sender: false };
    }
    // 根据当前周目数获取当前阶段
    getLevel(loop) {
      for (let n = levelLoop.length - 1; n >= 0; n--) {
        if (loop > n) return loop;
      }
      return 0;
    }
    // 设置当前周目
    async setLoop(groupid, loop) {
      if (!_.isInteger(loop) || loop < 0) return { reply: '无效的周目数' };

      const data = await this.getData(groupid);
      data.loop = loop;
      data.lv = this.getLevel(loop);
      await this.saveData(groupid, data);
      return { reply: `已设置当前周目为：${loop}周目 ${levels[data.lv]}`, at_sender: false };
    }
    // 开始战斗
    async startFight(gid, uid, team) {
      const data = await this.getData(gid);
      const { fighting, tree, log } = data;
      const func = obj => obj.qq === uid;

      if (_.find(fighting, func)) return { reply: '你仍在战斗中，不可重复进入战斗' };
      if (_.find(tree, func)) return { reply: '请先从树上下来，然后再开始新的战斗' };
      const myLog = _.find(log, func);
      if (myLog && myLog.count >= 3) return { reply: '你已经打够3次了，已经不用战斗也可以了' };

      if (!team) {
        team = (!myLog) ? '第一刀' : (myLog.count < 2 ? '第二刀' : '第三刀');
      }
      data.fighting.push({
        qq: uid,
        team,
        time: new Date().format('HH:mm:ss'),
      });

      await this.saveData(gid, data);
      const nick = await this.service.qqbot.groupmember.getNick(uid, gid);
      return { reply: `${nick}的战斗开始了!`, at_sender: false };
    }
    // 放弃出刀
    async skipFight(gid, uid) {
      const data = await this.getData(gid);
      const idx = _.findIndex(data.fighting, obj => obj.qq === uid);
      if (idx < 0) return { reply: '你的战斗尚未开始' };

      data.fighting.splice(idx, 1);

      await this.saveData(gid, data);
      const nick = await this.service.qqbot.groupmember.getNick(uid, gid);
      return { reply: `${nick}放弃了战斗!`, at_sender: false };
    }
    // 更新团战信息
    updateData(data, { qq, team }, count, damage) {
      const { cur, log, boss } = data;
      const idx = _.findIndex(log, obj => obj.qq === qq);

      // 更新BOSS血量
      cur.hp -= damage;
      if (cur.hp <= 0) {
        cur.id = (cur.id + 1) % data.boss.length;
        if (cur.id === 0)data.loop++;
        data.lv = this.getLevel(data.loop);
        cur.hp = boss[cur.id].hp[data.lv];
      }

      // 添加日志
      const damageText = `${team}(${boss[cur.id].alias[0]}：${damage})`;
      if (idx < 0) {
        log.push({ qq, count, damage: [ damageText ] });
      } else {
        log[idx].count += count;
        log[idx].damage.push(damageText);
      }
    }
    // 挂树
    async hangTree(gid, uid, damage) {
      if (!_.isInteger(damage)) return { reply: '请输入你的伤害值' };
      const data = await this.getData(gid);
      const idx = _.findIndex(data.fighting, obj => obj.qq === uid);
      if (idx < 0) return { reply: '你的战斗尚未开始，因此你上不了树' };

      const found = data.fighting[idx];

      found.time = new Date().format('HH:mm:ss');
      data.tree.push(found);
      this.updateData(data, found, 0.5, damage);
      data.fighting.splice(idx, 1);

      await this.saveData(gid, data);
      const nick = await this.service.qqbot.groupmember.getNick(uid, gid);
      return { reply: `${nick}上树了!`, at_sender: false };
    }
    // 完成战斗
    async completeFight(gid, uid, damage) {
      if (!_.isInteger(damage)) return { reply: '请输入你的伤害值' };
      const func = obj => obj.qq === uid;

      const data = await this.getData(gid);
      const idf = _.findIndex(data.fighting, func);
      const idt = _.findIndex(data.tree, func);
      if (idf < 0 && idt < 0) return { reply: '你的战斗尚未开始' };

      if (idf >= 0) {
        this.updateData(data, data.fighting[idf], 1, damage);
        data.fighting.splice(idf, 1);
      } else {
        this.updateData(data, data.tree[idt], 0.5, damage);
        data.fighting.splice(idt, 1);
      }

      await this.saveData(gid, data);
      const nick = await this.service.qqbot.groupmember.getNick(uid, gid);
      if (damage === 0) {
        return { reply: `${nick}${idf >= 0 ? '翻车了' : '从树上摔下来了'}!`, at_sender: false };
      }
      return { reply: `${nick}${idf >= 0 ? '完成了一场战斗' : '从树上爬下来了'}!`, at_sender: false };

    }
  }
  return MyService;
};
