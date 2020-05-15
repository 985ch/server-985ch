/**
 *设置交易成员信息
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', optional: true },
      name: { type: 'string' }, // 名字
      type: { type: 'integer', enum: [ 0, 1, 2 ] }, // 成员类型
      level: { type: 'integer', minimum: 0, maximum: 4 }, // 成员分类
      info: { type: 'string' }, // 备注
      hide: { type: 'integer', enum: [ 0, 1 ] }, // 是否隐藏
    },
    userdata: { permission: 'psi' },
    async controller() {
      const result = await this.service.psi.member.upsert(this.state.params);
      this.success(result);
    },
  };
};
