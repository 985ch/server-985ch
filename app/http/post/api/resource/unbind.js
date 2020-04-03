/**
 *解除资源绑定
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 },
    },
    userdata: { permission: 'admin' },
    async controller() {
      const result = await this.service.resource.data.unbind(this.state.params.id);
      this.success(result);
    },
  };
};
