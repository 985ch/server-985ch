/**
 *编辑记录
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer' }, // 记录ID
      type: { type: 'integer', enum: [ 0, 1 ] }, // 订单类型 0 进货 1 销售
      memberid: { type: 'integer', minimum: 0 }, // 目标对象
      amount: { type: 'number' }, // 金额，为正数时指收入，为负数时指支出
      postage: { type: 'number' }, // 邮费，一般为正数或0
      info: { type: 'string' }, // 备注
      logtime: { type: 'string' }, // 订单时间
      status: { type: 'integer', enum: [ 0, 1, 2, 3 ] }, // 订单状态
      goods: { // 商品信息
        type: 'array',
        items: {
          type: 'object',
          properties: {
            storeid: { type: 'integer' },
            goodsid: { type: 'integer' },
            num: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    userdata: { permission: 'psi' },
    async controller() {
      const { id, type, memberid, amount, postage, info, logtime, status, goods } = this.state.params;
      const log = { type, memberid, amount, postage, info, logtime, status };
      const result = await this.service.psi.log.edit(id, log, goods);
      this.success(result);
    },
  };
};
