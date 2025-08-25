// 快递查询 - 极简版本

class ExpressTracker {
    constructor() {
        this.init();
        this.bindEvents();
        this.loadHistory();
        this.userCity = null;
        this.getUserLocation();
    }

    init() {
        // 获取DOM元素
        this.trackingInput = document.getElementById('trackingNumber');
        this.searchBtn = document.getElementById('searchBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.resultSection = document.getElementById('resultSection');
        this.loadingSection = document.getElementById('loadingSection');
        this.errorSection = document.getElementById('errorSection');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        
        // 邮箱提醒元素
        this.emailInput = document.getElementById('emailInput');
        this.reminderToggle = document.getElementById('reminderToggle');
        
        // 结果展示元素
        this.resultTrackingNumber = document.getElementById('resultTrackingNumber');
        this.resultCourierName = document.getElementById('resultCourierName');
        this.statusBadge = document.getElementById('statusBadge');
        this.statusText = document.getElementById('statusText');
        this.timeline = document.getElementById('timeline');
        this.recipientName = document.getElementById('recipientName');
        this.recipientPhone = document.getElementById('recipientPhone');
        this.recipientAddress = document.getElementById('recipientAddress');
        this.packageWeight = document.getElementById('packageWeight');
        this.errorMessage = document.getElementById('errorMessage');
        
        // 快递公司配置
        this.couriers = {
            jd: {
                name: '京东快递',
                color: '#e1251b',
                patterns: [/^JD\d{10,}$/, /^JD\d{8}$/]
            },
            sf: {
                name: '顺丰快递',
                color: '#ff6b35',
                patterns: [/^SF\d{10,}$/, /^SF\d{8}$/, /^\d{12}$/]
            },
            yto: {
                name: '圆通快递',
                color: '#00a0e9',
                patterns: [/^YT\d{10,}$/, /^YT\d{8}$/, /^\d{10,}$/]
            }
        };
    }

    bindEvents() {
        // 搜索按钮点击事件
        this.searchBtn.addEventListener('click', () => this.searchExpress());
        
        // 重试按钮点击事件
        this.retryBtn.addEventListener('click', () => this.searchExpress());
        
        // 回车键搜索
        this.trackingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchExpress();
            }
        });
        
        // 邮箱提醒开关
        this.reminderToggle.addEventListener('click', () => this.toggleReminder());
        
        // 邮箱输入验证
        this.emailInput.addEventListener('input', () => this.validateEmail());
    }

    // 获取用户位置
    async getUserLocation() {
        try {
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                
                const { latitude, longitude } = position.coords;
                this.userCity = await this.getCityFromCoords(latitude, longitude);
                console.log('用户所在城市:', this.userCity);
            }
        } catch (error) {
            console.log('无法获取用户位置:', error);
            // 默认设置为北京
            this.userCity = '北京';
        }
    }

    // 根据坐标获取城市
    async getCityFromCoords(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
            const data = await response.json();
            return data.address.city || data.address.town || data.address.county || '未知城市';
        } catch (error) {
            console.log('获取城市信息失败:', error);
            return '北京';
        }
    }

    // 切换提醒开关
    toggleReminder() {
        this.reminderToggle.classList.toggle('active');
        const isActive = this.reminderToggle.classList.contains('active');
        
        if (isActive) {
            this.emailInput.focus();
            this.showNotification('请输入邮箱地址以启用提醒功能', 'info');
        } else {
            this.showNotification('已关闭到达提醒', 'info');
        }
    }

    // 验证邮箱格式
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.emailInput.style.borderColor = '#dc3545';
        } else {
            this.emailInput.style.borderColor = '#dfe1e5';
        }
    }

    // 自动识别快递公司
    detectCourier(trackingNumber) {
        for (const [code, courier] of Object.entries(this.couriers)) {
            if (courier.patterns.some(pattern => pattern.test(trackingNumber))) {
                return { code, name: courier.name };
            }
        }
        return null;
    }

    // 搜索快递
    async searchExpress() {
        const trackingNumber = this.trackingInput.value.trim();
        
        if (!trackingNumber) {
            this.showNotification('请输入快递单号', 'error');
            return;
        }

        // 自动识别快递公司
        const courierInfo = this.detectCourier(trackingNumber);
        if (!courierInfo) {
            this.showNotification('无法识别快递公司，请检查单号格式', 'error');
            return;
        }

        // 显示加载状态
        this.showLoading();
        
        try {
            // 模拟API调用
            const result = await this.fetchTrackingInfo(trackingNumber, courierInfo.name);
            
            // 保存到历史记录
            this.saveToHistory(trackingNumber, courierInfo.name);
            
            // 检查是否需要设置提醒
            this.checkReminderSettings(result);
            
            // 显示结果
            this.displayResult(result);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    // 检查提醒设置
    checkReminderSettings(result) {
        const isReminderActive = this.reminderToggle.classList.contains('active');
        const email = this.emailInput.value.trim();
        
        if (isReminderActive && email) {
            // 检查快递是否正在运输中且包含用户所在城市
            const isInTransit = result.status.includes('运输中') || result.status.includes('派送中');
            const containsUserCity = result.timeline.some(item => 
                item.location.includes(this.userCity) || 
                item.status.includes(this.userCity)
            );
            
            if (isInTransit && containsUserCity) {
                this.setupReminder(result, email);
            }
        }
    }

    // 设置提醒
    setupReminder(result, email) {
        // 这里可以集成真实的邮件服务
        console.log('设置提醒:', {
            trackingNumber: result.trackingNumber,
            email: email,
            userCity: this.userCity,
            courierName: result.courierName
        });
        
        this.showNotification('已设置到达提醒，快递到达本地时将发送邮件通知', 'success');
        
        // 模拟发送提醒邮件
        setTimeout(() => {
            this.sendReminderEmail(result, email);
        }, 5000); // 5秒后模拟发送
    }

    // 发送提醒邮件
    sendReminderEmail(result, email) {
        // 这里应该调用真实的邮件API
        console.log('发送提醒邮件到:', email, {
            subject: `快递到达提醒 - ${result.trackingNumber}`,
            body: `您的快递 ${result.trackingNumber} 已到达 ${this.userCity}，请注意查收。`
        });
        
        this.showNotification('提醒邮件已发送', 'success');
    }

    // 模拟获取快递信息
    async fetchTrackingInfo(trackingNumber, courierName) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        // 模拟不同的快递公司返回不同的数据
        const mockData = this.generateMockData(trackingNumber, courierName);
        
        // 模拟偶尔的查询失败
        if (Math.random() < 0.1) {
            throw new Error('快递单号不存在或已过期');
        }
        
        return mockData;
    }

    // 生成模拟数据
    generateMockData(trackingNumber, courierName) {
        const now = new Date();
        const statuses = ['已签收', '运输中', '派送中', '已揽收'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const timeline = [];
        const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];
        
        // 生成时间线数据
        for (let i = 0; i < 3 + Math.floor(Math.random() * 5); i++) {
            const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            const location = locations[Math.floor(Math.random() * locations.length)];
            const actions = [
                '快件已签收，签收人：门卫',
                '快件正在派送中，请保持电话畅通',
                '快件已到达派送点，准备派送',
                '快件运输中，预计明天到达',
                '快件已发出，正在运输途中',
                '快件已揽收，准备发出'
            ];
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

    // 显示加载状态
    showLoading() {
        this.resultSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        this.loadingSection.style.display = 'block';
    }

    // 显示结果
    displayResult(data) {
        this.loadingSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        this.resultSection.style.display = 'block';
        
        // 更新基本信息
        this.resultTrackingNumber.textContent = data.trackingNumber;
        this.resultCourierName.textContent = data.courierName;
        this.statusText.textContent = data.status;
        
        // 更新状态徽章样式
        this.statusBadge.className = 'status-badge';
        if (data.status === '已签收') {
            this.statusBadge.classList.add('delivered');
        } else if (data.status.includes('运输中') || data.status.includes('派送中')) {
            this.statusBadge.classList.add('in-transit');
        } else {
            this.statusBadge.classList.add('pending');
        }
        
        // 更新包裹信息
        this.recipientName.textContent = data.packageInfo.recipientName;
        this.recipientPhone.textContent = data.packageInfo.recipientPhone;
        this.recipientAddress.textContent = data.packageInfo.recipientAddress;
        this.packageWeight.textContent = data.packageInfo.packageWeight;
        
        // 更新时间线
        this.updateTimeline(data.timeline);
        
        this.showNotification('查询成功', 'success');
    }

    // 更新时间线
    updateTimeline(timeline) {
        this.timeline.innerHTML = '';
        
        timeline.forEach((item, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            
            // 检查是否包含用户所在城市
            const isUserCity = this.userCity && item.location.includes(this.userCity);
            const cityClass = isUserCity ? 'user-city' : '';
            
            timelineItem.innerHTML = `
                <div class="timeline-content ${cityClass}">
                    <div class="timeline-time">${item.time}</div>
                    <div class="timeline-status">${item.status}</div>
                    <div class="timeline-location">
                        ${item.location}
                        ${isUserCity ? '<i class="fas fa-map-marker-alt" style="color: #4285f4; margin-left: 5px;"></i>' : ''}
                    </div>
                </div>
            `;
            
            this.timeline.appendChild(timelineItem);
        });
    }

    // 显示错误
    showError(message) {
        this.loadingSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.errorSection.style.display = 'block';
        
        this.errorMessage.textContent = message;
    }

    // 显示通知
    showNotification(message, type = 'success') {
        this.notificationText.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }

    // 保存到历史记录
    saveToHistory(trackingNumber, courierName) {
        const history = this.getHistory();
        const newRecord = {
            trackingNumber,
            courierName,
            timestamp: new Date().toISOString()
        };
        
        // 避免重复记录
        const exists = history.find(record => record.trackingNumber === trackingNumber);
        if (!exists) {
            history.unshift(newRecord);
            // 只保留最近20条记录
            if (history.length > 20) {
                history.pop();
            }
            localStorage.setItem('expressHistory', JSON.stringify(history));
        }
    }

    // 获取历史记录
    getHistory() {
        const history = localStorage.getItem('expressHistory');
        return history ? JSON.parse(history) : [];
    }

    // 加载历史记录
    loadHistory() {
        const history = this.getHistory();
        if (history.length > 0) {
            console.log('历史记录:', history);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ExpressTracker();
});

// 添加一些额外的交互效果
document.addEventListener('DOMContentLoaded', () => {
    // 输入框焦点效果
    const trackingInput = document.getElementById('trackingNumber');
    trackingInput.addEventListener('focus', () => {
        trackingInput.style.transform = 'scale(1.02)';
    });
    
    trackingInput.addEventListener('blur', () => {
        trackingInput.style.transform = '';
    });
}); 