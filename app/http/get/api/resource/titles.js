/**
 *获取作品列表
*/
'use strict';

module.exports = () => {
  return {
    params: {
      keyword: { type: 'string', optional: true }, // 关键字
      types: { type: 'array', items: { type: 'integer' } }, // 类型
      nsfw: { type: 'integer', default: 0 }, // 是否NSFW
    },
    userdata: { permission: true },
    async controller() {
      const { keyword, types, nsfw } = this.state.params;
      const result = await this.service.resource.titles.find(keyword, types, nsfw);
      this.success(result);
    },
  };
};
