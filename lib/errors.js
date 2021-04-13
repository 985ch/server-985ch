'use strict';

const { CustomError } = require('egg-sachikawa').Errors;

// QQ机器人调用错误
class MiraiError extends CustomError {
  constructor(status, code, api) {
    super(`/${api}(${status})${code}`);
    this.data = { status, code, api };
  }
}

module.exports = {
  MiraiError,
};
