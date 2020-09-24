/**
 *密码加盐测试
*/
'use strict';

module.exports = () => {
  return {
    params: {
      qq: { type: 'string' }, // QQ号
      md5: { type: 'string' }, // 密码的MD5
    },
    async controller() {
      const { qq, md5 } = this.state.params;
      const result = await this.service.user.data.saltPassword(qq, md5);
      this.success(result);
    },
  };
};
