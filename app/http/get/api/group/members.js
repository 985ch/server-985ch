/**
 *获取群成员列表
*/
'use strict';

module.exports = () => {
  return {
    params: {
      groupid: { type: 'integer' },
    },
    userdata: { permission: true },
    async controller() {
      const { groupid } = this.state.params;
      const qq = this.state.userdata.qq;
      const group = this.service.qqbot.group;
      const checked = await group.checkUserGroup(qq, groupid);
      if (checked) {
        const result = await group.getGroupMembers(groupid);
        this.success(result);
      } else {
        this.fail('没有权限或群不存在');
      }
    },
  };
};
