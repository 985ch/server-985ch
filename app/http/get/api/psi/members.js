/**
 *获取进销存记录
*/
'use strict';

module.exports = () => {
  return {
    userdata: { permission: 'psi' },
    async controller() {
      const result = await this.service.psi.member.getData();
      if (result) {
        this.success(result);
      } else {
        this.fail('获取记录失败');
      }
    },
  };
};
