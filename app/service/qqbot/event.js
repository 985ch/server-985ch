// 命令解析脚本
'use strict';

module.exports = app => {
  const db = app.qqDB;
  const redis = app.redis.get('main');

  class MyService extends app.Service {
    // 设置允许加入的群号
    async setAllowGroup(groupId) {
      await redis.setex('qqbot:allowGroup:' + groupId, 3600 * 24, '1');
    }
    // 响应群邀请事件
    async onGroupInvited(info) {
      const result = await redis.get('qqbot:allowGroup:' + (info && info.groupId));
      if (result) {
        await this.service.rpc.mirai.replyInvitedJoinGroup(info, true);
      }
    }
    // 响应好友邀请事件
    async onFriendRequest(info) {
      const { groupId, fromId } = info || { groupId: 0, fromId: 0 };
      const found = await db.Groupnick.simpleFindOne({ groupid: groupId, qq: fromId }, [ 'nick' ]);
      if (found) {
        await this.service.rpc.mirai.replyNewFriendRequest(info, true);
      }
    }
  }
  return MyService;
};
