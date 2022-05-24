// 调用tracemoe识别动画
'use strict';

module.exports = app => {
  class MyService extends app.Service {
    // 请求trace.moe服务器
    async searchAnime(url, cutBorders = false) {

      // 获取数据
      let res = null;
      try {
        res = await this.ctx.curl(`https://api.trace.moe/search?anilistInfo${cutBorders ? '&cutBorders' : ''}&url=${encodeURI(url)}`, {
          method: 'GET',
          timeout: 60000,
          dataType: 'json',
        });
        if (res.status === 503) return { fail: -2, msg: '试图请求trace.moe被拒绝，可能查询次数已经超过每月限额!' };
        if (res.status === 429) return { fail: -2, msg: '单位时间调用次数已达上限!' };
        if (res.status !== 200) return { fail: -1, msg: '调用查询接口失败！' };
        if (res.data.error !== '') return { fail: -1, msg: 'trace.moe返回错误消息：' + res.data.error };
      } catch (e) {
        this.logger.error(e);
        return { fail: -1, msg: '调用trace.moe失败！' };
      }
      // 判断结果的有效性
      const results = res.data.result;
      const datas = this.getBestResults(results);
      if (datas.length === 0) return { fail: -2, msg: '没有找到靠谱的结果！' };
      // 获取本月配额
      let quota = -1;
      let used = 0;
      try {
        const res2 = await this.ctx.curl('https://api.trace.moe/me', {
          method: 'GET',
          dataType: 'json',
        });
        if (res.status === 200) {
          quota = res2.data.quota;
          used = res2.data.quotaUsed;
        }
      } catch (e) {
        // do nothing
      }

      // 返回结果
      return {
        quota,
        left: quota - used,
        datas,
      };
    }
    // 合并重复结果，并筛选最好的三个结果
    getBestResults(list) {
      const keys = {};
      const datas = [];
      for (const obj of list) {
        if (obj.similarity < 0.4) continue;

        const key = obj.anilist.id + obj.episode;
        if (!keys[key]) {
          const data = {
            similarity: obj.similarity,
            episode: obj.episode,
            from: this.getTimeText(obj.from),
            to: this.getTimeText(obj.to),
            title: this.getAniTitle(obj),
          };
          datas.push(data);
          if (datas.length >= 3) break; // 最多保留三个结果
          keys[key] = data;
        }
      }
      return datas;
    }
    // 根据秒数获取时间文本
    getTimeText(seconds) {
      let text = '';
      const s = Math.floor(seconds);
      const ss = s % 60;
      let mm = (s - ss) / 60;
      if (mm > 60) {
        const m = mm % 60;
        text = ((mm - m) / 60) + ':';
        mm = m;
      }
      text += `${mm > 9 ? mm : '0' + mm}:${ss > 9 ? ss : '0' + ss}`;
      return text;
    }
    // 从对象获取最合适的标题内容
    getAniTitle({ anilist, filename }) {
      if (anilist) {
        const { native, romaji, english } = anilist;
        return native || romaji || english;
      }
      return filename;
    }
  }
  return MyService;
};
