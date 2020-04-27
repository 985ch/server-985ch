/**
 *爬取bangumi的作品信息
*/
'use strict';

module.exports = () => {
  return {
    params: {
      url: { type: 'string' }, // 资源ID
    },
    userdata: { permission: true },
    async controller() {
      const { url } = this.state.params;
      const result = await this.service.crawler.bangumi.catch(url);
      if (result) {
        this.success(result);
      } else {
        this.fail('爬取失败');
      }
    },
  };
};
