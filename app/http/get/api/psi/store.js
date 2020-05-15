/**
 *获取库存信息
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', optional: true },
    },
    userdata: { permission: 'psi' },
    async controller() {
      const result = await this.service.psi.store.getData(this.state.params.id);
      if (result) {
        this.success(result);
      } else {
        this.fail('获取库存失败');
      }
    },
  };
};
