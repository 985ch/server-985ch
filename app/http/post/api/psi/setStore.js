/**
 *设置商品信息
*/
'use strict';

module.exports = () => {
  return {
    params: {
      goodsid: { type: 'integer' }, // 商品ID
      storeid: { type: 'integer' }, // 仓库ID
      num: { type: 'integer' }, // 商品数量
    },
    userdata: { permission: 'psi' },
    async controller() {
      await this.service.psi.store.setStore(this.state.params);
      this.success('修改成功');
    },
  };
};
