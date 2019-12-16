/**
 *登出账号
*/
'use strict';

module.exports = () => {
  return {
    userdata: { permission: true },
    async controller() {
      await this.service.user.cache.remove(this.get('Token'));
      this.success('已成功登出');
    },
  };
};
