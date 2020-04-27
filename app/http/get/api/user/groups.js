/**
 *获取用户所属的群列表
*/
'use strict';

module.exports = () => {
  return {
    userdata: { permission: true },
    async controller() {
      const qq = this.state.userdata.qq;
      const result = await this.service.qqbot.group.getUserGroups(qq);
      this.success(result);
    },
  };
};
