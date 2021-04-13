'use strict';

module.exports = {
  schedule: {
    interval: '1s',
    type: 'worker',
  },
  async task(ctx) {
    await ctx.service.qqbot.mirai.onBeat(99);
  },
};
