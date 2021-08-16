// 基础插件
'use strict';

const _ = require('lodash');

const helpReply = `点餐模块可以让bot帮你选择每日三餐甚至点心零食。
*注意：bot的选择无关营养搭配和健康，完全随机！
-点餐 【-标签 标签1..标签N】 【-食材 食材1..食材N】 随机选出一个菜单，可以通过tag选项和食材选项限制食材范围
-设置菜单 【菜单名字】 【-标签 标签1..标签N】 【-食材 食材1..食材N】 添加新的菜单或者为已有的菜单追加标签和食材
-移除菜单标签 【菜单名字】 【标签1】 【标签2】..【标签N】 移除菜单的指定标签
-移除食材 【菜单名字】 【食材1】 【食材2】..【食材N】 移除菜单的指定食材
-查看菜单 【菜单名字】 返回菜单的标签和食材等信息
-菜单列表 【关键字】 【-标签 标签1..标签N】 【-食材 食材1..食材N】 查找相关菜单，随机返回10个结果和结果数量
-食材列表 列出随机20个结果和结果数量
-菜单标签列表 列出随机20个菜单标签和标签数量`;

const regFlag = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？ ]"); // 判断文本中是否包含特殊符号的正则表达式

module.exports = app => {
  const db = app.qqDB;
  const sequelize = db.Sequelize;

  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, group, user, isPrivate }) {
      if (isPrivate) return null;
      switch (cmd.cmd) {
        case '点餐':
          return await this.randomMenu(cmd.params, group.id, user.nick, 1);
        case '设置菜单':
          return await this.setMenu(cmd.params, group.id, user.qq);
        case '移除菜单标签':
          return await this.removeLink(cmd.params, group.id, db.FoodMenutag, 'tid', 'FoodTags', 'tag');
        case '移除食材':
          return await this.removeLink(cmd.params, group.id, db.FoodMenuing, 'iid', 'FoodIngredient', 'name');
        case '查看菜单':
          return await this.getFoodInfo(cmd.params[0], group.id);
        case '菜单列表':
          return await this.randomMenu(cmd.params, group.id, user.nick, 10);
        case '食材列表':
          return await this.getList(group.id, db.FoodMenuing, db.FoodIngredient, 'name', '食材');
        case '菜单标签列表':
          return await this.getList(group.id, db.FoodMenutag, db.FoodTags, 'tag', '标签');
        default:
          break;
      }
      return null;
    }
    // 心跳事件
    async onBeat() {
      return null;
    }
    // 帮助文本
    get helpText() { return helpReply; }
    // 随机点餐
    async randomMenu(params, groupid, nick, limit) {
      // 获取查询条件
      const { name, tags, ings, fail } = this.splitParams(params, false);
      if (fail) return { reply: fail, at_sender: true };
      if (tags.length + ings.length > 5) return { reply: '最多只支持5个筛选条件', at_sender: true };
      const ingIds = await this.getIds('FoodIngredient', 'name', ings);
      const tagIds = await this.getIds('FoodTags', 'tag', tags);
      if (ingIds.length !== ings.length || tagIds.length !== tags.length) {
        return { reply: '标签或食材中包含未知要素，无法找到对应菜单', at_sender: true };
      }

      // 根据查询条件生成联查语句
      const include = [];
      for (let i = 0; i < tagIds.length; i++) {
        const tid = tagIds[i];
        include.push({
          attributes: [],
          required: true,
          model: db.FoodMenutag,
          where: { tid, enable: 1 },
          as: 'menuTags' + i,
        });
      }
      for (let i = 0; i < ingIds.length; i++) {
        const iid = ingIds[i];
        include.push({
          attributes: [],
          required: true,
          model: db.FoodMenuing,
          where: { iid, enable: 1 },
          as: 'menuIngs' + i,
        });
      }
      // 根据条件生成查询对象
      const findJson = {
        attributes: [ 'name' ],
        include,
        where: {
          groupid: [ 0, groupid ],
          enable: 1,
        },
        order: [ sequelize.fn('RAND') ],
        limit,
        raw: true,
      };
      if (name) {
        findJson.where.name = { [sequelize.Op.like]: '%' + name + '%' };
      }
      const found = await db.FoodMenu.findAll(findJson);

      // 返回单个菜单
      if (limit === 1) {
        if (found.length === 0) return { reply: '未找到任何菜单' };
        return { reply: `${nick}的点餐结果是：${found[0].name}` };
      }

      // 生成条件文本
      let conText = name ? '名字包含“' + name + '”' : '';
      conText += (tags.length > 0 ? (conText !== '' ? '，' : '') + '标签包含“' + tags.join('”，“') + '”' : '');
      conText += (ings.length > 0 ? (conText !== '' ? '，并且' : '') + '使用了食材“' + ings.join('”，“') + '”' : '');
      if (found.length === 0) {
        return { reply: '没有找到' + conText + _.map(found, 'name').join('，') + '的菜单' };
      }
      conText += (conText !== '' ? '的菜单有：\n' : '目前共有菜单：\n');

      // 批量返回菜单
      if (found.length < limit) {
        return { reply: conText + _.map(found, 'name').join('，') };
      }
      const count = await db.FoodMenu.count(findJson);
      return { reply: conText + _.map(found, 'name').join('，') + (count > limit ? ' 等共' + count + '个' : '') };
    }
    // 设置菜单
    async setMenu(params, groupid, qq) {
      const { name, tags, ings, fail } = this.splitParams(params, true);
      if (fail) return { reply: fail, at_sender: true };

      const ingIds = await this.getIds('FoodIngredient', 'name', ings, name => { return { name, creator: qq }; });
      const tagIds = await this.getIds('FoodTags', 'tag', tags, name => { return { tag: name }; });
      const [ menu ] = await db.FoodMenu.findOrCreate({
        where: { name, groupid: [ 0, groupid ] },
        defaults: {
          groupid,
          name,
          enable: 1,
          creator: qq,
        },
      });
      const mid = menu.id;
      for (const tid of tagIds) {
        await db.FoodMenutag.upsert({ tid, mid, enable: 1 });
      }
      for (const iid of ingIds) {
        await db.FoodMenuing.upsert({ iid, mid, enable: 1 });
      }
      return await this.getFoodInfo(name, groupid, '已记录！\n');
    }
    // 移除标签或者食材对菜单的关联
    async removeLink(params, groupid, asModel, asKey, dataTable, dataKey) {
      const name = params[0];
      if (!name) return { reply: '无效的菜单名称', at_sender: true };
      const found = await db.FoodMenu.simpleFindOne({ name, groupid: [ 0, groupid ], enable: 1 }, [ 'id', 'name' ]);
      if (!found) return { reply: `未找到菜单：${name}` };
      const ids = await this.getIds(dataTable, dataKey, _.tail(params));
      await asModel.destroy({ where: { mid: found.id, [asKey]: ids } });
      return await this.getFoodInfo(name, groupid, '已修改！\n');
    }
    // 拆解参数
    splitParams(list, needName) {
      let startIdx = 0;
      let name = list[0] || null;
      if (name && name[0] !== '-') {
        startIdx = 1;
      } else {
        name = null;
      }
      if (needName && (!name || regFlag.test(name))) {
        return { fail: '非法的菜单名' };
      }
      let flag = '';
      const tags = [];
      const ings = [];
      for (let i = startIdx; i < list.length; i++) {
        const text = list[i];
        if (list[i] === '-标签' || list[i] === '-食材') {
          flag = list[i];
        } else if (flag === '-标签') {
          if (regFlag.test(text)) return { fail: '标签不能包含特殊字符' };
          if (!tags.includes(text))tags.push(text);
        } else if (flag === '-食材') {
          if (regFlag.test(text)) return { fail: '食材不能包含特殊字符' };
          if (!ings.includes(text))ings.push(text);
        } else {
          return { fail: '参数错误' };
        }
      }
      return { name, tags, ings };
    }
    // 根据食材名称获取食材ID
    async getIds(tableName, key, names, createInfo) {
      if (!names || names.length === 0) return [];
      names = _.uniq(names);
      return await db.transaction(async t => {
        // 查询现有数据
        const found = await db[tableName].findAll({
          attributes: [ 'id', key ],
          where: { [key]: names },
          transaction: t,
          raw: true,
        });
        // 将数据处理成ID并返回
        const ids = [];
        for (const name of names) {
          const row = _.find(found, { [key]: name });
          if (row) {
            ids.push(row.id);
          } else if (createInfo) {
            const created = await db[tableName].create(
              createInfo(name),
              { transaction: t }
            );
            ids.push(created.dataValues.id);
          }
        }
        return ids;
      });
    }
    // 获取菜单信息
    async getFoodInfo(name, groupid, pretext = '') {
      if (!name) return { reply: '无效的菜单名称', at_sender: true };
      const found = await db.FoodMenu.simpleFindOne({ name, groupid: [ 0, groupid ], enable: 1 }, [ 'id', 'name' ]);
      if (!found) return { reply: `未找到菜单：${name}` };
      const ings = await db.FoodIngredient.findAll({
        attributes: [ 'name' ],
        include: [{
          attributes: [],
          model: db.FoodMenuing,
          required: true,
          where: {
            mid: found.id,
            enable: 1,
          },
        }],
        raw: true,
      });
      const tags = await db.FoodTags.findAll({
        attributes: [ 'tag' ],
        include: [{
          attributes: [],
          model: db.FoodMenutag,
          required: true,
          where: {
            mid: found.id,
            enable: 1,
          },
        }],
        raw: true,
      });
      const tagText = tags.length > 0 ? _.map(tags, 'tag').join(',') : '未设置标签';
      const ingText = ings.length > 0 ? _.map(ings, 'name').join(',') : '未知食材';
      const text = `菜单：${name}\n标签：${tagText}\n食材：${ingText}`;
      return { reply: pretext + text };
    }
    // 获取标签或者食材列表
    async getList(groupid, asModel, dataModel, dataKey, replyKey) {
      const data = await asModel.findAll({
        attributes: [[ sequelize.literal(dataModel.tableName + '.' + dataKey), 'name' ]],
        include: [{
          attributes: [],
          required: true,
          model: dataModel,
          as: dataModel.tableName,
        }, {
          attributes: [],
          required: true,
          model: db.FoodMenu,
          where: { groupid: [ 0, groupid ] },
        }],
        group: dataModel.tableName + '.' + dataKey,
        raw: true,
      });
      const count = data.length;
      if (count <= 20) {
        return { reply: `目前菜单中的${replyKey}有：${_.map(data, 'name').join('，')}` };
      }
      const samples = _.sampleSize(data, 20);
      return { reply: `目前菜单中的${replyKey}有：${_.map(samples, 'name').join('，')}等共${count}个` };
    }
  }
  return MyService;
};
