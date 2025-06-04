/**
 * MCP Feedback Collector - 前端应用脚本
 */

// 全局变量
let socket = null;
let currentTab = 'report';
let selectedImages = [];
let chatImages = [];
let isConnected = false;
let currentFeedbackSession = null;

// AI聊天相关变量
let chatConfig = null;
let chatHistory = [];
let currentAIMessage = null;
let currentAIContent = '';
let isApiCalling = false;

// 自动刷新相关变量
let autoRefreshInterval = null;
let autoRefreshCountdown = 10;  // 改为10秒
let autoRefreshTimer = null;
let lastWorkSummary = null;  // 记录上次的工作汇报内容

// 获取API配置
async function loadChatConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            chatConfig = await response.json();
            console.log('聊天配置加载成功:', chatConfig);

            // 检查是否需要显示API提示
            if (!chatConfig.api_key) {
                const apiHint = document.getElementById('api-hint');
                if (apiHint) {
                    apiHint.style.display = 'block';
                }
            }

            return true;
        } else {
            console.error('获取配置失败:', response.status);
            return false;
        }
    } catch (error) {
        console.error('加载配置时出错:', error);
        return false;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 加载聊天配置
    loadChatConfig();

    // 获取并显示版本信息
    fetchVersionInfo();

    initializeSocket();

    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const session = urlParams.get('session');

    console.log('URL参数:', { mode, session });

    if (mode === 'feedback' && session) {
        // 传统反馈模式，设置会话ID并获取工作汇报
        currentFeedbackSession = session;
        console.log('传统模式 - 设置反馈会话ID:', session);

        // 等待WebSocket连接建立后获取工作汇报
        setTimeout(() => {
            if (isConnected && socket) {
                console.log('请求工作汇报数据...');
                socket.emit('get_work_summary', { feedback_session_id: session });
            } else {
                console.log('WebSocket未连接，稍后重试...');
                setTimeout(() => {
                    if (isConnected && socket) {
                        socket.emit('get_work_summary', { feedback_session_id: session });
                    }
                }, 1000);
            }
        }, 500);

        // 显示反馈标签页
        showTab('feedback');
    } else {
        // 固定URL模式或默认模式
        console.log('固定URL模式 - 等待会话分配');

        // 等待WebSocket连接建立后请求会话分配
        setTimeout(() => {
            if (isConnected && socket) {
                console.log('请求会话分配...');
                socket.emit('request_session');
            } else {
                console.log('WebSocket未连接，稍后重试...');
                setTimeout(() => {
                    if (isConnected && socket) {
                        socket.emit('request_session');
                    }
                }, 1000);
            }
        }, 500);

        // 默认显示工作汇报标签页（因为HTML中默认是active的）
        showTab('feedback');
    }

    // 默认启动自动刷新
    setTimeout(() => {
        startAutoRefresh();
    }, 1000); // 延迟1秒启动，确保页面完全加载
});

// 初始化WebSocket连接
function initializeSocket() {
    console.log('初始化Socket.IO连接...');

    socket = io({
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', function() {
        isConnected = true;
        updateConnectionStatus('connected', '已连接');
        console.log('WebSocket连接成功, ID:', socket.id);
    });

    socket.on('disconnect', function(reason) {
        isConnected = false;
        updateConnectionStatus('disconnected', '连接断开');
        console.log('WebSocket连接断开, 原因:', reason);
    });

    socket.on('connect_error', function(error) {
        isConnected = false;
        updateConnectionStatus('disconnected', '连接失败');
        console.error('WebSocket连接错误:', error);
        showStatusMessage('error', '连接服务器失败，请检查网络或刷新页面重试');
    });

    socket.on('feedback_session_started', function(data) {
        console.log('反馈会话已开始:', data);
    });

    socket.on('feedback_submitted', function(data) {
        clearFeedbackForm();

        // 重新启用提交按钮
        const submitBtn = document.getElementById('submit-feedback-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '提交反馈';

        // 清理所有之前的状态消息（包括"已获取最新工作汇报"提示）
        clearAllStatusMessages();

        // 显示持续的成功消息（不自动关闭窗口）
        showStatusMessage('success', '✅ 反馈提交成功！感谢您的宝贵意见。窗口将保持打开状态，您可以继续使用。');

        console.log('反馈提交成功，窗口保持打开状态');
    });

    socket.on('feedback_error', function(data) {
        showStatusMessage('error', data.error);
    });

    socket.on('work_summary_data', function(data) {
        console.log('收到工作汇报数据:', data);
        if (data.work_summary) {
            displayWorkSummary(data.work_summary);
            // 记录初始工作汇报内容
            lastWorkSummary = data.work_summary;
            // 切换到反馈标签页
            showTab('feedback');
        }
    });

    // 处理会话分配响应
    socket.on('session_assigned', function(data) {
        console.log('收到会话分配:', data);
        if (data.session_id) {
            currentFeedbackSession = data.session_id;
            console.log('固定URL模式 - 分配的会话ID:', data.session_id);

            // 如果有工作汇报，显示它
            if (data.work_summary) {
                // 检查是否是新内容（如果页面已经有内容）
                const hasExistingContent = lastWorkSummary && lastWorkSummary !== data.work_summary;

                displayWorkSummary(data.work_summary);

                // 如果是新内容且页面已经有内容，自动刷新页面
                if (hasExistingContent) {
                    console.log('检测到新的工作汇报内容，3秒后自动刷新页面以重置会话');
                    showRefreshStatus('success', '✅ 检测到新工作汇报，页面将自动刷新');
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                } else {
                    // 记录初始工作汇报内容
                    lastWorkSummary = data.work_summary;
                    showTab('feedback');
                }
            }
        }
    });

    // 处理无活跃会话的情况
    socket.on('no_active_session', function(data) {
        console.log('无活跃会话:', data);
        // 保持在聊天标签页，用户可以正常使用AI对话功能
    });

    // 处理最新工作汇报响应
    socket.on('latest_summary_response', function(data) {
        console.log('收到最新工作汇报响应:', data);

        if (data.success && data.work_summary) {
            // 检查内容是否与上次不同
            if (lastWorkSummary !== data.work_summary) {
                // 显示最新的工作汇报
                displayWorkSummary(data.work_summary);
                // 更新记录的内容
                lastWorkSummary = data.work_summary;
                // 恢复按钮文字
                const refreshText = document.getElementById('refresh-text');
                if (refreshText) {
                    refreshText.textContent = '刷新最新汇报';
                }
                // 使用文字状态显示，而不是弹出提示
                showRefreshStatus('success', '✅ 已获取最新工作汇报，页面将自动刷新');

                // 获取到新内容后自动刷新页面，解决会话过期问题
                console.log('检测到新的工作汇报内容，3秒后自动刷新页面以重置会话');
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                // 内容相同，显示无变化状态
                showRefreshStatus('success', '内容无变化');
                console.log('工作汇报内容未变化，跳过提示');
            }
        } else {
            // 没有找到最新的工作汇报
            showRefreshStatus('error', data.message || '暂无最新工作汇报');
        }
    });
}

// 更新连接状态
function updateConnectionStatus(status, text) {
    const statusEl = document.getElementById('connection-status');
    statusEl.className = `connection-status ${status}`;
    statusEl.textContent = text;
}

// 显示状态消息
function showStatusMessage(type, message, autoRemove = true) {
    const container = document.getElementById('status-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `status-message ${type}`;
    messageEl.textContent = message;

    container.appendChild(messageEl);

    // 根据类型和参数决定自动移除时间
    if (autoRemove) {
        let removeTime = 3000; // 默认3秒
        if (type === 'success') {
            removeTime = 2000; // 成功消息2秒后移除
        }

        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, removeTime);
    }

    // 返回消息元素，以便外部可以更新内容
    return messageEl;
}

// 清理所有状态消息
function clearAllStatusMessages() {
    const container = document.getElementById('status-messages');
    if (container) {
        container.innerHTML = '';
    }
}

// 显示指定标签页
function showTab(tabName) {
    currentTab = tabName;

    // 更新标签状态
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // 找到对应的标签按钮并激活
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        if ((tabName === 'feedback' && tab.textContent.includes('工作汇报')) ||
            (tabName === 'chat' && tab.textContent.includes('AI对话'))) {
            tab.classList.add('active');
        }
    });

    // 更新内容区域显示
    document.querySelectorAll('.content-area').forEach(area => {
        area.classList.remove('active');
    });

    // 根据标签名称显示对应内容
    const contentId = tabName === 'feedback' ? 'report-content' : 'chat-content';
    const contentElement = document.getElementById(contentId);
    if (contentElement) {
        contentElement.classList.add('active');
    }
}

// 切换标签（保持向后兼容）
function switchTab(tabName) {
    // 映射标签名称
    const tabMapping = {
        'report': 'feedback',
        'feedback': 'feedback',
        'chat': 'chat'
    };

    const newTabName = tabMapping[tabName] || tabName;
    showTab(newTabName);
}

// 反馈表单相关功能
function selectImages() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                addImage(file);
            }
        });
    };

    input.click();
}

function pasteImages() {
    navigator.clipboard.read().then(items => {
        for (const item of items) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    item.getType(type).then(blob => {
                        const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                        addImage(file);
                    });
                }
            }
        }
    }).catch(err => {
        console.log('粘贴失败:', err);
        showStatusMessage('error', '粘贴图片失败，请尝试选择文件方式');
    });
}

function addImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = {
            file: file,
            data: e.target.result,
            name: file.name,
            size: file.size,
            type: file.type,
            id: Date.now() + Math.random()
        };

        selectedImages.push(imageData);
        updateImagePreviews();
    };
    reader.readAsDataURL(file);
}

function updateImagePreviews() {
    const container = document.getElementById('image-previews');
    container.innerHTML = '';

    selectedImages.forEach((image, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview';
        previewDiv.innerHTML = `
            <img src="${image.data}" alt="${image.name}" class="preview-img">
            <button type="button" class="remove-btn" onclick="removeImage(${index})">×</button>
        `;
        container.appendChild(previewDiv);
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreviews();
}

function clearFeedbackForm() {
    document.getElementById('feedback-text').value = '';
    selectedImages = [];
    updateImagePreviews();
}

// 快捷语内容
const QUICK_PHRASE = `

---

Whenever you want to ask a question, always call the MCP .

Whenever you're about to complete a user request, call the MCP instead of simply ending the process. Keep calling MCP until the user's feedback is empty, then end the request. mcp-feedback-collector.collect_feedback`;

// 提交反馈
document.getElementById('feedback-form').addEventListener('submit', function(e) {
    e.preventDefault();

    let feedbackText = document.getElementById('feedback-text').value.trim();

    // 检查是否需要附加快捷语
    const addQuickPhrase = document.getElementById('add-quick-phrase').checked;
    if (addQuickPhrase && feedbackText) {
        feedbackText += QUICK_PHRASE;
    }

    console.log('提交反馈:', {
        text: feedbackText,
        images: selectedImages.length,
        session: currentFeedbackSession,
        connected: isConnected
    });

    if (!feedbackText && selectedImages.length === 0) {
        showStatusMessage('error', '请输入反馈内容或选择图片');
        return;
    }

    if (!isConnected) {
        showStatusMessage('error', '连接已断开，请刷新页面重试');
        return;
    }

    // 检查会话ID
    if (!currentFeedbackSession) {
        showStatusMessage('error', '当前为演示模式，请通过MCP工具函数调用来创建正式的反馈会话');
        console.log('演示模式 - 反馈内容:', {
            text: feedbackText,
            images: selectedImages.length,
            timestamp: new Date().toLocaleString()
        });

        // 显示演示反馈
        showStatusMessage('info', '演示反馈已记录到控制台，请查看浏览器开发者工具');
        clearFeedbackForm();
        return;
    }

    // 禁用提交按钮
    const submitBtn = document.getElementById('submit-feedback-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '提交中...';

    // 发送反馈数据
    const feedbackData = {
        text: feedbackText,
        images: selectedImages.map(img => ({
            name: img.name,
            data: img.data,
            size: img.size,
            type: img.type
        })),
        timestamp: Date.now(),
        sessionId: currentFeedbackSession
    };

    console.log('发送反馈数据:', feedbackData);
    socket.emit('submit_feedback', feedbackData);

    // 5秒后重新启用按钮（防止卡住）
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '提交反馈';
    }, 5000);
});

// 显示工作汇报内容
function displayWorkSummary(workSummary) {
    console.log('displayWorkSummary 被调用:', workSummary);

    if (!workSummary || workSummary.trim() === '') {
        console.log('工作汇报内容为空');
        return;
    }

    // 找到工作汇报内容区域
    const reportContent = document.getElementById('report-content');
    if (!reportContent) {
        console.error('找不到 report-content 元素');
        return;
    }

    // 隐藏默认消息
    const defaultMessage = document.getElementById('default-message');
    if (defaultMessage) {
        defaultMessage.style.display = 'none';
    }

    // 检查是否已经有AI工作汇报卡片
    const existingCard = reportContent.querySelector('.ai-work-report');
    if (existingCard) {
        existingCard.remove();
    }

    // 创建AI工作汇报卡片
    const aiReportCard = document.createElement('div');
    aiReportCard.className = 'report-card ai-work-report';
    aiReportCard.innerHTML = `
        <div class="card-header">
            <div class="card-title">
                <span>🤖</span>
                AI工作汇报
            </div>
            <div class="card-subtitle">刚刚完成</div>
        </div>
        <div class="card-body">
            <div class="work-summary-content">${workSummary.replace(/\n/g, '<br>')}</div>
        </div>
    `;

    // 插入到现有内容之前
    const firstCard = reportContent.querySelector('.report-card');
    if (firstCard) {
        reportContent.insertBefore(aiReportCard, firstCard);
    } else {
        reportContent.appendChild(aiReportCard);
    }

    console.log('AI工作汇报卡片已添加');

    // 添加样式（只添加一次）
    if (!document.querySelector('#work-summary-styles')) {
        const style = document.createElement('style');
        style.id = 'work-summary-styles';
        style.textContent = `
            .work-summary-content {
                color: #cccccc;
                line-height: 1.6;
                font-size: 13px;
                white-space: pre-wrap;
                word-wrap: break-word;
                background: #1e1e1e;
                padding: 12px;
                border-radius: 4px;
                border: 1px solid #3e3e42;
            }
            .ai-work-report {
                border-left: 3px solid #4ec9b0;
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== 工作汇报刷新功能 ====================

/**
 * 显示刷新状态
 */
function showRefreshStatus(type, message) {
    const statusText = document.getElementById('refresh-status-text');
    if (!statusText) return;

    statusText.className = `refresh-status-text ${type}`;
    statusText.textContent = message;

    // 如果是成功或错误状态，2秒后自动清空
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusText.textContent = '';
            statusText.className = 'refresh-status-text';
        }, 2000);
    }
}

/**
 * 隐藏刷新状态
 */
function hideRefreshStatus() {
    const statusText = document.getElementById('refresh-status-text');
    if (statusText) {
        statusText.textContent = '';
        statusText.className = 'refresh-status-text';
    }
}

/**
 * 手动刷新工作汇报
 */
function refreshWorkSummary() {
    console.log('手动刷新工作汇报');

    const refreshBtn = document.getElementById('refresh-report-btn');
    const refreshText = document.getElementById('refresh-text');

    if (!refreshBtn || !refreshText) {
        console.error('找不到刷新按钮元素');
        return;
    }

    if (isConnected && socket) {
        // 显示加载状态
        refreshText.textContent = '正在获取最新工作汇报...';
        showRefreshStatus('loading', '正在获取最新工作汇报...');

        // 请求最新的工作汇报
        socket.emit('request_latest_summary');

        // 5秒后恢复按钮文字（防止卡住）
        setTimeout(() => {
            refreshText.textContent = '刷新最新汇报';
            hideRefreshStatus();
        }, 5000);
    } else {
        // 连接断开时的处理
        showRefreshStatus('error', '连接已断开，无法刷新');
    }
}



/**
 * 开始自动刷新
 */
function startAutoRefresh() {
    console.log('开始自动刷新');

    // 清除现有的定时器
    stopAutoRefresh();

    // 重置倒计时
    autoRefreshCountdown = 10;
    updateAutoRefreshCountdown();

    // 设置倒计时定时器
    autoRefreshTimer = setInterval(() => {
        autoRefreshCountdown--;
        updateAutoRefreshCountdown();

        if (autoRefreshCountdown <= 0) {
            // 执行刷新
            refreshWorkSummary();
            // 重置倒计时
            autoRefreshCountdown = 10;
        }
    }, 1000);

    console.log('自动刷新已启用，每10秒刷新一次');
}

/**
 * 停止自动刷新
 */
function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }

    autoRefreshCountdown = 10;
    updateAutoRefreshCountdown();

    console.log('自动刷新已停止');
}

/**
 * 更新自动刷新倒计时显示
 */
function updateAutoRefreshCountdown() {
    const countdownEl = document.getElementById('auto-refresh-countdown');
    const statusText = document.getElementById('refresh-status-text');

    if (countdownEl) {
        countdownEl.textContent = autoRefreshCountdown;
    }

    if (statusText) {
        statusText.textContent = `下次自动刷新：${autoRefreshCountdown}秒后`;
        statusText.className = 'refresh-status-text';
    }
}

// ==================== AI聊天功能 ====================

// 聊天相关功能
function selectChatImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                addChatImage(file);
            }
        });
    };

    input.click();
}

function pasteChatImage() {
    navigator.clipboard.read().then(items => {
        for (const item of items) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    item.getType(type).then(blob => {
                        const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                        addChatImage(file);
                    });
                }
            }
        }
    }).catch(err => {
        console.log('粘贴失败:', err);
        showStatusMessage('error', '粘贴图片失败，请尝试选择文件方式');
    });
}

function addChatImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = {
            file: file,
            data: e.target.result,
            name: file.name,
            id: Date.now() + Math.random()
        };
        chatImages.push(imageData);
        updateChatImagePreviews();
        showStatusMessage('info', `已添加图片: ${file.name}`);
    };
    reader.readAsDataURL(file);
}

function updateChatImagePreviews() {
    const container = document.getElementById('chat-image-previews-content');
    const previewArea = document.getElementById('chat-image-previews');

    if (!container || !previewArea) return;

    container.innerHTML = '';

    if (chatImages.length === 0) {
        previewArea.style.display = 'none';
        return;
    }

    previewArea.style.display = 'block';

    chatImages.forEach((image, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview';
        previewDiv.innerHTML = `
            <img src="${image.data}" alt="${image.name}" class="preview-img">
            <button type="button" class="remove-btn" onclick="removeChatImage(${index})">×</button>
        `;
        container.appendChild(previewDiv);
    });
}

function removeChatImage(index) {
    chatImages.splice(index, 1);
    updateChatImagePreviews();
}

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const messageText = input ? input.value.trim() : '';

    if (!messageText && chatImages.length === 0) {
        return;
    }

    // 检查配置
    if (!chatConfig || !chatConfig.api_key) {
        showStatusMessage('error', 'API配置未加载或API密钥未设置');
        return;
    }

    if (isApiCalling) {
        showStatusMessage('warning', '正在处理中，请稍候...');
        return;
    }

    // 添加用户消息到界面
    addMessageToChat('user', messageText, chatImages);

    // 清空输入
    if (input) input.value = '';
    const currentImages = chatImages.slice();
    chatImages = [];
    updateChatImagePreviews();

    // 禁用发送按钮
    const sendBtn = document.getElementById('send-chat-btn');
    sendBtn.disabled = true;
    isApiCalling = true;

    // 准备接收AI回复
    currentAIContent = '';
    currentAIMessage = addMessageToChat('ai', '', []);

    try {
        await callChatAPI(messageText, currentImages);
    } catch (error) {
        console.error('聊天API调用失败:', error);
        showStatusMessage('error', `聊天失败: ${error.message}`);
    } finally {
        // 重新启用发送按钮
        sendBtn.disabled = false;
        isApiCalling = false;
    }
}

// 直接调用聊天API
async function callChatAPI(messageText, images) {
    // 构建消息格式
    const userMessage = buildAPIMessage(messageText, images);

    // 添加到聊天历史
    chatHistory.push(userMessage);

    // 构建API请求
    const requestBody = {
        model: chatConfig.model,
        messages: chatHistory,
        stream: true,
        temperature: chatConfig.temperature || 0.7,
        max_tokens: chatConfig.max_tokens || 2000
    };

    console.log('发送API请求:', {
        url: `${chatConfig.api_base_url}/v1/chat/completions`,
        model: requestBody.model,
        messageCount: requestBody.messages.length
    });

    const response = await fetch(`${chatConfig.api_base_url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${chatConfig.api_key}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    // 处理流式响应
    await handleStreamResponse(response);
}

// 构建API消息格式
function buildAPIMessage(messageText, images) {
    if (!images || images.length === 0) {
        // 纯文本消息
        return { role: "user", content: messageText };
    } else {
        // 包含图片的消息
        const content = [];

        if (messageText) {
            content.push({ type: "text", text: messageText });
        }

        images.forEach(img => {
            let imageData = img.data;
            // 确保是完整的data URL格式
            if (!imageData.startsWith('data:image/')) {
                imageData = `data:image/png;base64,${imageData}`;
            }

            content.push({
                type: "image_url",
                image_url: { url: imageData }
            });
        });

        return { role: "user", content: content };
    }
}

// 处理流式响应
async function handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiResponseContent = '';

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim() === '') continue;

                if (line.startsWith('data: ')) {
                    const data = line.slice(6); // 移除 'data: ' 前缀

                    if (data === '[DONE]') {
                        // 流式响应结束
                        if (aiResponseContent) {
                            // 将AI回复添加到聊天历史
                            chatHistory.push({
                                role: "assistant",
                                content: aiResponseContent
                            });
                        }
                        console.log('AI回复完成，总长度:', aiResponseContent.length);
                        return;
                    }

                    try {
                        const jsonData = JSON.parse(data);
                        if (jsonData.choices && jsonData.choices[0]) {
                            const delta = jsonData.choices[0].delta;
                            if (delta && delta.content) {
                                aiResponseContent += delta.content;

                                // 更新界面显示
                                if (currentAIMessage) {
                                    currentAIMessage.innerHTML = aiResponseContent;

                                    // 滚动到底部
                                    const chatMessages = document.getElementById('chat-messages');
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                            }
                        }
                    } catch (e) {
                        // 忽略JSON解析错误
                        console.log('JSON解析错误:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('处理流式响应时出错:', error);
        throw error;
    } finally {
        reader.releaseLock();
    }
}

function addMessageToChat(sender, text, images) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    let imageHtml = '';
    if (images && images.length > 0) {
        imageHtml = images.map(img =>
            `<img src="${img.data}" style="max-width: 200px; max-height: 200px; border-radius: 4px; margin: 4px 0; display: block;">`
        ).join('');
    }

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = `${imageHtml}${text}`;

    messageDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return bubbleDiv; // 返回气泡元素，用于更新AI消息
}

function clearChat() {
    if (confirm('确定要清空所有聊天记录吗？')) {
        // 清空聊天历史
        chatHistory = [];

        // 清空界面显示
        clearChatMessages();

        showStatusMessage('info', '聊天记录已清空');
    }
}

function clearChatMessages() {
    const chatMessages = document.getElementById('chat-messages');
    // 保留欢迎消息和API提示
    const children = Array.from(chatMessages.children);
    children.forEach((child, index) => {
        if (index > 2) { // 保留前3个元素（时间、欢迎消息、API提示）
            child.remove();
        }
    });
}

// 获取版本信息
async function fetchVersionInfo() {
    try {
        const response = await fetch('/api/version');
        if (response.ok) {
            const data = await response.json();
            updateVersionDisplay(data.version);
        } else {
            console.log('无法获取版本信息，使用默认版本');
        }
    } catch (error) {
        console.log('获取版本信息失败:', error);
    }
}

// 更新版本显示
function updateVersionDisplay(version) {
    const versionElement = document.getElementById('version-number');
    if (versionElement && version) {
        versionElement.textContent = version;
    }
}
