/**
 * 更新资源数据
*/
'use strict';

module.exports = () => {
  return {
    params: {
      key: 'string',
      path: 'string',
      folder: 'string',
      info: 'string',
    },
    async controller() {
      const { key, path, folder, info } = this.state.params;
      const cli = await this.service.system.client.info(key);
      if (!cli) {
        return this.fail('invalid client', this.app.errCode.INVAILD_PERMISSIONS);
      }
      const result = await this.service.resource.data.updateResource(cli.config.source || 'unknown', path + '/' + folder, info);
      this.success(result);
    },
  };
};
