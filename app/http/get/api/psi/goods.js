/**
 *获取商品信息
*/
'use strict';

module.exports = () => {
  return {
    userdata: { permission: 'psi' },
    async controller() {
      const result = await this.service.psi.goods.getData();
      if (result) {
        this.success(result);
      } else {
        this.fail('获取商品信息失败');
      }
    },
  };
};
