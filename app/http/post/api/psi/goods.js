/**
 *设置商品信息
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', optional: true },
      name: { type: 'string' }, // 名字
      info: { type: 'string' }, // 备注
      hide: { type: 'integer', enum: [ 0, 1 ] }, // 是否隐藏
      prices: { type: 'array', items: { type: 'number' } }, // 各个级别价格列表
    },
    userdata: { permission: 'psi' },
    async controller() {
      const { id, name, info, hide, prices } = this.state.params;
      const result = await this.service.psi.goods.upsert({ id, name, info, hide }, prices);
      this.success(result);
    },
  };
};
