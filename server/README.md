# 快递查询聚合平台 - 后端服务

这是快递查询聚合平台的后端服务，提供RESTful API接口。

## 🚀 快速开始

1. 安装依赖
```bash
cd server
npm install
```

2. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，填入相应的API密钥
```

3. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 📡 API接口

### 健康检查
```
GET /api/health
```

### 快递查询
```
POST /api/track
Content-Type: application/json

{
  "trackingNumber": "JD1234567890",
  "courier": "auto" // 可选: auto, jd, sf, yto
}
```

### 获取快递公司列表
```
GET /api/couriers
```

### 快递单号验证
```
POST /api/validate
Content-Type: application/json

{
  "trackingNumber": "JD1234567890"
}
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3000 |
| JD_API_KEY | 京东快递API密钥 | - |
| SF_API_KEY | 顺丰快递API密钥 | - |
| YTO_API_KEY | 圆通快递API密钥 | - |
| NODE_ENV | 运行环境 | development |

### 快递公司配置

目前支持以下快递公司：

- **京东快递 (jd)**
  - 单号格式: JD + 数字
  - API地址: https://api.jd.com/tracking

- **顺丰快递 (sf)**
  - 单号格式: SF + 数字 或 纯数字12位
  - API地址: https://api.sf-express.com/tracking

- **圆通快递 (yto)**
  - 单号格式: YT + 数字 或 纯数字
  - API地址: https://api.yto.net.cn/tracking

## 🛠️ 开发

### 项目结构
```
server/
├── server.js          # 主服务器文件
├── package.json       # 项目配置
├── env.example        # 环境变量示例
└── README.md         # 说明文档
```

### 添加新的快递公司

1. 在 `couriers` 对象中添加配置
2. 在 `detectCourier` 函数中添加识别规则
3. 在 `generateMockData` 函数中添加相应的模拟数据

### 集成真实API

1. 获取相应快递公司的API密钥
2. 在 `.env` 文件中配置API密钥
3. 修改 `fetchTrackingInfo` 函数调用真实API
4. 处理API返回的数据格式

## 📊 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    "trackingNumber": "JD1234567890",
    "courierName": "京东快递",
    "status": "已签收",
    "timeline": [
      {
        "time": "2024-01-15 14:30:00",
        "status": "快件已签收，签收人：门卫",
        "location": "北京"
      }
    ],
    "packageInfo": {
      "recipientName": "张先生",
      "recipientPhone": "138****8888",
      "recipientAddress": "北京市朝阳区某某街道某某小区",
      "packageWeight": "1.2kg"
    }
  }
}
```

### 错误响应
```json
{
  "error": "快递单号不存在或已过期"
}
```

## 🔒 安全考虑

- 使用环境变量存储敏感信息
- 实现API密钥验证
- 添加请求频率限制
- 记录API调用日志
- 实现错误处理机制

## 🚀 部署

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2部署
```bash
npm install -g pm2
pm2 start server.js --name express-tracker
pm2 save
pm2 startup
```

## �� 许可证

MIT License 