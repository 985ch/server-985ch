// 命令解析脚本
'use strict';

module.exports = app => {
  class MyService extends app.Service {
    // 从字符串的指定位置开始截取参数
    readParams(text, n) {
      if (n < 0) return [];
      const params = [];
      const len = text.length;
      do {
        n = this.skipEmpty(text, n, len);
        const readed = this.readAParam(text, n, len);
        if (readed.param !== null)params.push(readed.param);
        n = readed.next;
      } while (n < len);
      return params;
    }
    // 是否空字符
    isEmpty(s) {
      return s === ' ' || s === '\t' || s === '\n';
    }
    // 跳过指定空字符
    skipEmpty(text, n, len) {
      while (n < len) {
        if (!this.isEmpty(text[n])) return n;
        n++;
      }
      return n;
    }
    // 读取一个参数
    readAParam(text, n, len) {
      // 确定结尾标记，end为null表示任意空白字符都是结尾标记
      const start = n;
      let flag;
      switch (text[start]) {
        case '[':
          flag = ']';
          break;
        case "'":
        case '"':
        case '`':
          flag = text[start];
          break;
        default:
          flag = null;
          break;
      }
      // 逐个字符判断结尾
      let cur;
      do {
        n++;
        cur = text[n];
        if (flag) {
          if (cur === flag) {
            return {
              param: text.substring(start + 1, n),
              next: n + 1,
            };
          }
        } else if (this.isEmpty(cur)) {
          return {
            param: text.substring(start, n),
            next: n,
          };
        }
      } while (n < len);
      return {
        param: len - start > 0 ? text.substring(start) : null,
        next: len,
      };
    }
  }
  return MyService;
};
