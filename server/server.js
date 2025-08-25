const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('../')); // 服务静态文件

// 快递公司配置
const couriers = {
    jd: {
        name: '京东快递',
        apiUrl: 'https://api.jd.com/tracking', // 示例API地址
        headers: {
            'Authorization': process.env.JD_API_KEY || 'your-jd-api-key'
        }
    },
    sf: {
        name: '顺丰快递',
        apiUrl: 'https://api.sf-express.com/tracking', // 示例API地址
        headers: {
            'Authorization': process.env.SF_API_KEY || 'your-sf-api-key'
        }
    },
    yto: {
        name: '圆通快递',
        apiUrl: 'https://api.yto.net.cn/tracking', // 示例API地址
        headers: {
            'Authorization': process.env.YTO_API_KEY || 'your-yto-api-key'
        }
    }
};

// 自动识别快递公司
function detectCourier(trackingNumber) {
    const patterns = {
        jd: [/^JD\d{10,}$/, /^JD\d{8}$/],
        sf: [/^SF\d{10,}$/, /^SF\d{8}$/, /^\d{12}$/],
        yto: [/^YT\d{10,}$/, /^YT\d{8}$/, /^\d{10,}$/]
    };

    for (const [code, patternList] of Object.entries(patterns)) {
        if (patternList.some(pattern => pattern.test(trackingNumber))) {
            return code;
        }
    }
    return null;
}

// 模拟快递查询数据
function generateMockData(trackingNumber, courierName) {
    const now = new Date();
    const statuses = ['已签收', '运输中', '派送中', '已揽收'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const timeline = [];
    const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];
    const actions = [
        '快件已签收，签收人：门卫',
        '快件正在派送中，请保持电话畅通',
        '快件已到达派送点，准备派送',
        '快件运输中，预计明天到达',
        '快件已发出，正在运输途中',
        '快件已揽收，准备发出'
    ];
    
    // 生成时间线数据
    for (let i = 0; i < 3 + Math.floor(Math.random() * 5); i++) {
        const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const location = locations[Math.floor(Math.random() * locations.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        timeline.push({
            time: date.toLocaleString('zh-CN'),
            status: action,
            location: location
        });
    }
    
    // 按时间排序
    timeline.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    return {
        trackingNumber,
        courierName,
        status,
        timeline,
        packageInfo: {
            recipientName: '张先生',
            recipientPhone: '138****8888',
            recipientAddress: '北京市朝阳区某某街道某某小区',
            packageWeight: '1.2kg'
        }
    };
}

// API路由

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '快递查询服务运行正常' });
});

// 快递查询接口
app.post('/api/track', async (req, res) => {
    try {
        const { trackingNumber, courier } = req.body;
        
        if (!trackingNumber) {
            return res.status(400).json({ error: '快递单号不能为空' });
        }
        
        let courierCode = courier;
        
        // 如果未指定快递公司，自动识别
        if (!courierCode || courierCode === 'auto') {
            courierCode = detectCourier(trackingNumber);
            if (!courierCode) {
                return res.status(400).json({ error: '无法识别快递公司，请手动选择' });
            }
        }
        
        const courierConfig = couriers[courierCode];
        if (!courierConfig) {
            return res.status(400).json({ error: '不支持的快递公司' });
        }
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // 模拟偶尔的查询失败
        if (Math.random() < 0.1) {
            return res.status(404).json({ error: '快递单号不存在或已过期' });
        }
        
        // 返回模拟数据
        const result = generateMockData(trackingNumber, courierConfig.name);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('查询快递时出错:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取支持的快递公司列表
app.get('/api/couriers', (req, res) => {
    const courierList = Object.entries(couriers).map(([code, config]) => ({
        code,
        name: config.name
    }));
    
    res.json({
        success: true,
        data: courierList
    });
});

// 快递单号格式验证
app.post('/api/validate', (req, res) => {
    const { trackingNumber } = req.body;
    
    if (!trackingNumber) {
        return res.status(400).json({ error: '快递单号不能为空' });
    }
    
    const courierCode = detectCourier(trackingNumber);
    
    res.json({
        success: true,
        data: {
            isValid: !!courierCode,
            courier: courierCode ? couriers[courierCode].name : null
        }
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚚 快递查询服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`🔍 快递查询: POST http://localhost:${PORT}/api/track`);
});

module.exports = app; 