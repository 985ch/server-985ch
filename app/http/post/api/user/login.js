/**
 *登陆账号
 *@param {string} code 登陆码
*/
'use strict';

module.exports = () => {
  return {
    params: {
      code: 'string',
    },
    async controller() {
      const { code } = this.state.params;
      const token = await this.service.user.data.login(code);
      this.success(token);
    },
  };
};
