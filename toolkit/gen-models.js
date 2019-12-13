'use strict';

const path = require('path');
const generator = require('egg-sequelize-mg');
const config = require('../config/default/sequelize'); // 数据库配置脚本

const tables = { // 可以在这里配置每个数据库需要生成的数据模型，没有配置的数据库默认生成所有表的数据模型
  // sample: ['table1', 'table2']
};

const fileHead = `'use strict';

const utils = require('egg-sachikawa').Utils;

module.exports = app => {
  const DataTypes = app.Sequelize;
`;

const fileTail = `
  utils.extendModel(model);
  model.associate = function() {
  };

  return model;
};
`;
// 连接数据库，查询表信息并输出数据模型文件到指定目录
generator.generate(config, tables, path.join(__dirname, '../app/'), async (appRoot, config, tables) => {
  const result = await generator.readMysql(appRoot, config, tables);
  result.config.fileHead = fileHead;
  result.config.fileTail = fileTail;
  return result;
});
