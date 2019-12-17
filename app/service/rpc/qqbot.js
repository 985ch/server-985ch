// 对接QQ机器人
'use strict';

const _ = require('lodash');

module.exports = app => {
  const botCfg = app.config.qqbot;
  class MyService extends app.Service {
    // 发送请求到服务器
    async request(func, options) {
      options.dataType = 'json';
      const res = await app.curl(`${botCfg.host}/${func}`, options);
      if (res.status !== 200) {
        throw new Error(`${func}调用失败(${res.status})`);
      }
      if (res.data.status === 'failed') {
        throw new Error(`${func}调用失败,详见http接口`);
      }
      return res.data.data;
    }
    // 获取群成员列表
    async getGroupMemberList(group_id) {
      return await this.request('get_group_member_list', {
        method: 'GET',
        dataType: 'json',
        data: {
          group_id,
        },
      });
    }
    // 获取群列表
    async getGroupList() {
      return await this.request('get_group_list', {
        method: 'GET',
        dataType: 'json',
      });
    }
    // 获取群信息
    async getGroupInfo(group_id) {
      return await this.request('get_group_info', {
        method: 'GET',
        dataType: 'json',
        data: {
          group_id,
          no_cache: true,
        },
      });
    }
    // 发送群消息
    async sendGroupMsg(group_id, message) {
      return await this.request('send_group_msg', {
        method: 'POST',
        data: {
          group_id,
          message: this.transMessage(message),
        },
        dataType: 'json',
      });
    }
    // 发送消息
    async sendPrivateMsg(user_id, message) {
      return await this.request('send_private_msg', {
        method: 'POST',
        data: {
          user_id,
          message: this.transMessage(message),
        },
        dataType: 'json',
      });
    }
    // 消息转换
    transMessage(message, start = -1, end = -1) {
      if (_.isString(message)) {
        return message;
      }
      let msg = '';
      start = (start < 0) ? 0 : start;
      end = (end <= 0) ? message.length : end;
      for (let i = start; i < end; i++) {
        const cur = message[i];
        switch (cur.type) {
          case 'text':
            msg += cur.data.text;
            break;
          case 'image':
            // msg += `[CQ:image,file=${cur.data.url}]`;
            msg += '[CQ:image,file=0.png]';
            // msg += '[图片]';
            break;
          case 'at':
            msg += `[CQ:at,qq=${cur.data.qq}]`;
            break;
          case 'face':
          case 'emoji':
          case 'bface':
          case 'sface':
            msg += `[CQ:${cur.type},id=${cur.data.id}]`;
            break;
          case 'record': // 录音，暂不处理
          case 'music': // 音乐，暂不处理
          case 'share': // 分享，暂不处理
            break;
          default:
            break;
        }
      }
      return msg;
    }
  }
  return MyService;
};
