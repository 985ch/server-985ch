/**
 *获取用户信息
*/
'use strict';

module.exports = () => {
  return {
    userdata: { permission: true },
    async controller() {
      this.success(this.state.userdata);
    },
  };
};
