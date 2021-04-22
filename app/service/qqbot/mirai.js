// 命令解析脚本
'use strict';

module.exports = app => {
  const db = app.qqDB;
  const botCfg = app.config.qqbot;

  class MyService extends app.Service {
    // 响应心跳事件，并同步拉取信息
    async onBeat(count) {
      // 拉取信息并分发处理
      const list = await this.service.rpc.mirai.fetchMessage(count);
      for (const cur of list) {
        await this.onRawMessage(cur);
      }
      // 插件逐个处理心跳事件
      const bot = this.service.botplugin;
      for (const key in bot) {
        const cur = bot[key];
        if (cur.onBeat) await cur.onBeat();
      }
    }
    // 响应消息和事件
    async onRawMessage(data) {
      switch (data.type) {
        case 'GroupMessage': // 群消息
          await this.onGroupMessage(data);
          break;
        case 'FriendMessage': // 好友消息
        case 'TempMessage': // 临时会话消息
          await this.onPrivateMessage(data);
          break;
        case 'BotOnlineEvent': // Bot登录成功
        case 'BotOfflineEventActive': // Bot主动离线
        case 'BotOfflineEventForce': // Bot被挤下线
        case 'BotOfflineEventDropped': // Bot被服务器断开或因网络问题而掉线
        case 'BotReloginEvent': // Bot主动重新登录
          this.onEventLog(data.type);
          break;
        case 'BotMuteEvent': // Bot被禁言
          break;
        case 'BotUnmuteEvent': // Bot被取消禁言
          break;
        case 'BotJoinGroupEvent': // Bot加入新群
          this.onEventLog(data.type, { group: data.group.id });
          break;
        case 'BotLeaveEventActive': // Bot主动退出一个群
        case 'BotLeaveEventKick': // Bot被踢出一个群
          this.onEventLog(data.type, { group: data.group.id });
          break;
        case 'BotInvitedJoinGroupRequestEvent': // Bot被邀请入群申请
          {
            const success = await this.service.qqbot.event.onGroupInvited(data);
            this.onEventLog(data.type, { group: data.groupId, eventId: data.eventId, qq: data.fromId, success });
          }
          break;
        case 'GroupRecallEvent': // 群消息撤回
        case 'FriendRecallEvent': // 好友消息撤回
          break;
        case 'GroupNameChangeEvent': // 群名称改变
          break;
        case 'GroupMuteAllEvent': // 全员禁言
          break;
        case 'MemberJoinEvent': // 新人入群
          break;
        case 'MemberLeaveEventKick': // bot以外的成员被踢出群事件
        case 'MemberLeaveEventQuit': // bot以外的成员退群事件
          break;
        case 'MemberCardChangeEvent': // 群名片改动事件
          break;
        case 'MemberSpecialTitleChangeEvent': // 群头衔改动事件
          break;
        case 'MemberPermissionChangeEvent': // bot以外的成员权限改变事件
          break;
        case 'MemberMuteEvent': // bot以外的成员被禁言事件
          break;
        case 'MemberUnmuteEvent': // bot以外的成员被取消禁言
          break;
        case 'NewFriendRequestEvent': // 添加好友申请
          {
            const success = await this.service.qqbot.event.onFriendRequest(data);
            this.onEventLog(data.type, { group: data.groupId, eventId: data.eventId, qq: data.fromId, success });
          }
          break;
        case 'MemberJoinRequestEvent': // 用户入群申请
          break;
        case 'NudgeEvent': // 戳一戳事件
          break;
        case 'GroupEntranceAnnouncementChangeEvent': // 某群入群公告改变
        case 'GroupAllowAnonymousChatEvent': // 匿名聊天状态改变
        case 'GroupAllowConfessTalkEvent': // 坦白说状态改变
        case 'GroupAllowMemberInviteEvent': // 允许群员邀请好友加群状态改变
          break;
        default:
          break;
      }
    }
    // 记录日志
    async onEventLog(event, info = null) {
      await db.LogEvent.create({ type: event, info: info ? JSON.stringify(info) : null });
    }
    // 处理群消息
    async onGroupMessage({ sender, messageChain } = {}) {
      messageChain.shift();
      const qqbot = this.service.qqbot;
      // 存储历史记录
      const history = await qqbot.group.saveHistory(sender.group.id, sender.id, messageChain);
      // 解析命令并获取个人和群组信息
      const msgInfo = await qqbot.data.groupMessageInfo(sender, messageChain);
      msgInfo.history = history;
      // 逐个模块处理信息，直到其中一个返回
      const bot = this.service.botplugin;
      for (const plugin of msgInfo.plugins) {
        const cur = bot[plugin];
        if (!cur.onMessage) continue;
        const result = await cur.onMessage(msgInfo, messageChain);
        if (result) {
          const message = await this.reply(sender, result);
          await qqbot.group.saveHistory(msgInfo.group.id, botCfg.qq, message);
          break;
        }
      }
    }
    // 处理私人消息
    async onPrivateMessage({ sender, messageChain } = {}) {
      const qqbot = this.service.qqbot;
      // 解析命令并获取个人和群组信息
      const msgInfo = await qqbot.data.privateMessageInfo(sender, messageChain);
      // 逐个模块处理信息，直到其中一个返回
      const bot = this.service.botplugin;
      for (const plugin of msgInfo.plugins) {
        const cur = bot[plugin];
        if (!cur.onMessage) continue;
        const result = await cur.onMessage(msgInfo, messageChain);
        if (result) {
          await this.reply(sender, result);
          break;
        }
      }
    }
    // 回复消息
    async reply(sender, { at_sender, reply } = {}) {
      const messageService = this.service.qqbot.message;
      const message = messageService.transMessage(reply);
      if (sender.group) {
        if (at_sender)message.unshift({ type: 'At', target: sender.id, display: '' });
        await messageService.sendGroupMessage(sender, message);
      } else {
        await messageService.sendPrivateMessage(sender, message);
      }
      return message;
    }
  }
  return MyService;
};


/*
{
  user: {
    qq: '58636110',
    nick: '自杀机器',
    isAdmin: false,
    isOwner: false,
    roles: [ 'qqbot' ],
    config: { groupid: 10696496 }
  },
  group: {
    id: 10696496,
    name: '静冈竞马场',
    plugins: [ 'base', 'nick', 'responderCmd', 'responderReply' ],
    config: {}
  },
  isPrivate: false,
  plugins: [ 'base', 'nick', 'responderCmd', 'responderReply' ],
  cmd: {}
}
{
  userid: '58636110',
  msg: [
    { type: 'Source', id: 4769588, time: 1619075522 },
    { type: 'Plain', text: '我忍住了没抽切噜' }
  ],
  t: 1619075522497
}
*/

/*
{
  user: {
    qq: '115839257',
    nick: '985CH',
    isAdmin: false,
    isOwner: false,
    roles: [ 'root', 'admin', 'qqbot', 'editor', 'adult', 'psi' ],
    config: { groupid: 10696496 }
  },
  group: {
    id: 10696496,
    name: '静冈竞马场',
    plugins: [ 'base', 'nick', 'responderCmd', 'responderReply' ],
    config: {}
  },
  isPrivate: true,
  plugins: [ 'base', 'nick', 'responderCmd', 'responderReply' ],
  cmd: {}
}
*/
