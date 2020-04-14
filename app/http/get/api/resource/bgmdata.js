/**
 *爬取bangumi的作品信息
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 }, // 资源ID
    },
    // userdata: { permission: true },
    async controller() {
      const { id } = this.state.params;
      const result = await this.service.crawler.bangumi.catch(id);
      if (result) {
        this.success(result);
      } else {
        this.fail('爬取失败');
      }
    },
  };
};
