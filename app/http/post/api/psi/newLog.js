/**
 *添加进销存记录
*/
'use strict';

module.exports = () => {
  return {
    params: {
      type: { type: 'integer', minimum: 0, maximum: 5 }, // 订单类型 0进货 1销售 2充值支出 3充值收入 4其他支出 5其他收入
      memberid: { type: 'integer', minimum: 0 }, // 目标对象
      storeid: { type: 'integer', minimum: 0 }, // 仓库
      amount: { type: 'number' }, // 金额
      cost: { type: 'number' }, // 成本
      postage: { type: 'number' }, // 邮费
      info: { type: 'string' }, // 备注
      logtime: { type: 'string' }, // 订单时间
      status: { type: 'integer', enum: [ 0, 1, 2, 3 ] }, // 订单状态
      goods: { // 商品信息
        type: 'array',
        items: {
          type: 'object',
          properties: {
            goodsid: { type: 'integer' },
            num: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    userdata: { permission: 'psi' },
    async controller() {
      const { type, memberid, storeid, amount, cost, postage, info, logtime, status, goods } = this.state.params;
      if (goods.length === 0) return this.fail('商品列表不可为空');
      const log = { type, memberid, storeid, amount, cost, postage, info, logtime, status };
      const result = await this.service.psi.log.add(log, goods);
      this.success(result);
    },
  };
};
