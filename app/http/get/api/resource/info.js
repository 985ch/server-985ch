/**
 *获取资源数据
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 }, // 资源ID
    },
    userdata: { permission: true },
    async controller() {
      const { id } = this.state.params;
      const result = await this.service.resource.data.getData(id);
      this.success(result);
    },
  };
};
