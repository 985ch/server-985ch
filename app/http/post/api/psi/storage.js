/**
 *设置仓库信息
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', optional: true },
      name: { type: 'string' }, // 名字
      info: { type: 'string' }, // 备注
      type: { type: 'integer', enum: [ 0, 1, 2 ] }, // 类型
      memberid: { type: 'integer' }, // 关联用户ID
      balance: { type: 'number' },
      hide: { type: 'integer', eunm: [ 0, 1 ] }, // 是否隐藏
    },
    userdata: { permission: 'psi' },
    async controller() {
      const result = await this.service.psi.store.upsertStorage(this.state.params);
      this.success(result);
    },
  };
};
