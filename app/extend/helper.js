'use strict';

const _ = require('lodash');

// 裁剪开头，只要开头符合列表中任意一个即可
function cutStarts(text, list) {
  for (let i = 0; i < list.length; i++) {
    const cur = list[i];
    if (_.startsWith(text, cur)) {
      return text.substring(cur.length);
    }
  }
  return null;
}
// 裁剪结尾，只要结尾符合列表中任意一个即可
function cutEnds(text, list) {
  for (let i = 0; i < list.length; i++) {
    const cur = list[i];
    if (_.endsWith(text, cur)) {
      return text.substring(text.length - cur.length, text.length);
    }
  }
  return null;
}
// 截断，并采用两分法
function split2(text, flags) {
  const results = [];
  for (const flag of flags) {
    const list = text.split(flag);
    if (list.length < 2) continue;

    for (let i = 1; i < list.length; i++) {
      results.push([ _.slice(list, 0, i).join(flag), _.slice(list, i).join(flag) ]);
    }
  }
  return results;
}

module.exports = {
  cutStarts,
  cutEnds,
  split2,
};
