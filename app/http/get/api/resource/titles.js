/**
 *获取作品列表
*/
'use strict';

module.exports = () => {
  return {
    params: {
      keyword: { type: 'string', optional: true }, // 关键字
      types: { type: 'array', items: { type: 'integer' } }, // 类型
      nsfw: { type: 'integer', enum: [ 0, 1 ] }, // 是否NSFW
      concern: { type: 'integer', enum: [ 0, 1 ] }, // 是否NSFW
      offset: { type: 'integer', minimum: 0, default: 0 }, // 偏移量
      limit: { type: 'integer', mininum: 1, default: 20 }, // 单页限制数量
    },
    compress: true,
    userdata: { permission: true },
    async controller() {
      const { nsfw } = this.state.params;
      if (nsfw && this.state.userdata.roles.indexOf('adult') < 0) {
        this.state.params.nsfw = 0;
      }
      const result = await this.service.resource.titles.find(this.state.params);
      this.success(result);
    },
  };
};
