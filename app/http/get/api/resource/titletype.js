/**
 *获取所有作品类型
*/
'use strict';

module.exports = () => {
  return {
    async controller() {
      const types = await this.service.resource.cache.getTitleTypes();
      this.success(types);
    },
  };
};
