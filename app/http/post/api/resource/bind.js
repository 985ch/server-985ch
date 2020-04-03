/**
 *绑定资源和作品
*/
'use strict';

module.exports = () => {
  return {
    params: {
      titleid: { type: 'integer', minimum: 0 }, // 作品ID
      resid: { type: 'integer', minimum: 0 }, // 资源ID
      folder: 'string', // 子路径
    },
    userdata: { permission: 'admin' },
    async controller() {
      const result = await this.service.resource.data.bind(this.state.params);
      this.success(result);
    },
  };
};
