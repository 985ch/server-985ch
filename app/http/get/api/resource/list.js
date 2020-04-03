/**
 *获取资源列表
*/
'use strict';

module.exports = () => {
  return {
    params: {
      keyword: { type: 'string', optional: true }, // 关键字
    },
    compress: true,
    userdata: { permission: 'admin' },
    async controller() {
      const { keyword } = this.state.params;
      const result = await this.service.resource.data.find(keyword);
      this.success(result);
    },
  };
};
