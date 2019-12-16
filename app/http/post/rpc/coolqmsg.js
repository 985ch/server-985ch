/**
 * 接受coolQ的消息上报并处理
 * 使用插件参照:https://cqhttp.cc/docs/
*/
'use strict';

module.exports = app => {
  return {
    ip: app.config.qqbot.ip,
    async controller() {
      try {
        const content = JSON.parse(this.request.rawBody);
        // 由机器人模块处理消息和通知
        const answer = await this.service.qqbot.core.onEvent(content);
        this.body = JSON.stringify(answer);
      } catch (e) {
        this.logger.error(e);
        this.body = '{}';
      }
    },
  };
};
