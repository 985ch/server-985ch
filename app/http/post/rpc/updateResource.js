/**
 * 更新资源数据
*/
'use strict';

module.exports = () => {
  return {
    params: {
      path: 'string',
      folder: 'string',
      info: 'string',
    },
    clientauth: true,
    async controller() {
      const { path, folder, info } = this.state.params;
      const cli = this.state.clientInfo;
      const result = await this.service.resource.data.updateResource(cli.config.source || 'unknown', path + '/' + folder, info);
      this.success(result);
    },
  };
};
