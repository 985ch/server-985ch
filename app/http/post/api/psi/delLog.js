/**
 *删除日志
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 }, // 删除日志
    },
    userdata: { permission: 'psi' },
    async controller() {
      const result = await this.service.psi.log.del(this.state.params.id);
      this.success(result);
    },
  };
};
