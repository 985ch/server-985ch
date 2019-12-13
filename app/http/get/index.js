/**
 *vue主页
*/
'use strict';

module.exports = () => {
  return {
    async controller() {
      await this.render('index.html', {});
    },
  };
};
