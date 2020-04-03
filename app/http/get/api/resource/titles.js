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
    },
    compress: true,
    userdata: { permission: true },
    async controller() {
      let { keyword, types, nsfw } = this.state.params;
      if (nsfw && this.state.userdata.roles.indexOf('adult') < 0) {
        nsfw = 0;
      }
      const result = await this.service.resource.titles.find(keyword, types, nsfw);
      this.success(result);
    },
  };
};
