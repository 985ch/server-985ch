/**
 *登陆账号
 *@param {string} qq QQ号
 *@param {string} code 登陆码或密码的MD5
*/
'use strict';

module.exports = () => {
  return {
    params: {
      qq: 'string', // QQ号
      code: 'string', // 登陆码或密码的MD5
    },
    async controller() {
      const { qq, code } = this.state.params;
      const token = await this.service.user.data.login(qq, code);
      this.success(token);
    },
  };
};
