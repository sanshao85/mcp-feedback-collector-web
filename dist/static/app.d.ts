declare function loadChatConfig(): Promise<boolean>;
declare function initializeTheme(): void;
declare function initializeSocket(): void;
declare function updateConnectionStatus(status: any, text: any): void;
declare function showStatusMessage(type: any, message: any, autoRemove?: boolean): HTMLDivElement;
declare function clearAllStatusMessages(): void;
declare function showTab(tabName: any): void;
declare function switchTab(tabName: any): void;
declare function selectImages(): void;
declare function pasteImages(): void;
declare function addImage(file: any): void;
declare function updateImagePreviews(): void;
declare function removeImage(index: any): void;
declare function convertImagesToText(): Promise<void>;
declare function clearFeedbackForm(): void;
declare function showSubmitConfirmDialog(feedbackText: any): void;
declare function hideSubmitConfirmDialog(): void;
declare function submitFeedback(feedbackText: any, shouldCloseAfterSubmit: any): void;
declare function displayWorkSummary(workSummary: any): void;
/**
 * 显示刷新状态
 */
declare function showRefreshStatus(type: any, message: any): void;
/**
 * 隐藏刷新状态
 */
declare function hideRefreshStatus(): void;
/**
 * 手动刷新工作汇报
 */
declare function refreshWorkSummary(): void;
/**
 * 开始自动刷新
 */
declare function startAutoRefresh(): void;
/**
 * 停止自动刷新
 */
declare function stopAutoRefresh(): void;
/**
 * 更新自动刷新倒计时显示
 */
declare function updateAutoRefreshCountdown(): void;
declare function selectChatImage(): void;
declare function pasteChatImage(): void;
declare function addChatImage(file: any): void;
declare function updateChatImagePreviews(): void;
declare function removeChatImage(index: any): void;
declare function handleChatKeydown(event: any): void;
declare function sendChatMessage(): Promise<void>;
declare function callChatAPI(messageText: any, images: any): Promise<void>;
declare function buildAPIMessage(messageText: any, images: any): {
    role: string;
    content: any;
};
declare function handleStreamResponse(response: any): Promise<void>;
declare function addMessageToChat(sender: any, text: any, images: any): HTMLDivElement | null;
declare function clearChat(): void;
declare function clearChatMessages(): void;
declare function fetchVersionInfo(): Promise<void>;
declare function updateVersionDisplay(version: any): void;
/**
 * 启动会话超时计时器
 * @param {number} timeoutMs 超时时间（毫秒）
 */
declare function startSessionTimeout(timeoutMs: number): void;
/**
 * 清除会话超时计时器
 */
declare function clearSessionTimeout(): void;
/**
 * 显示超时警告
 */
declare function showTimeoutWarning(): void;
/**
 * 前端会话超时处理 - 只关闭页面，不提交反馈（后端会自动提交）
 */
declare function handleFrontendTimeout(): void;
/**
 * 获取剩余时间（秒）
 */
declare function getRemainingTime(): number;
/**
 * 启动倒计时显示
 */
declare function startCountdownDisplay(): void;
/**
 * 更新倒计时显示
 */
declare function updateCountdownDisplay(): void;
/**
 * 隐藏倒计时显示
 */
declare function hideCountdownDisplay(): void;
/**
 * MCP Feedback Collector - 前端应用脚本
 */
declare let socket: null;
declare let currentTab: string;
declare let selectedImages: any[];
declare let chatImages: any[];
declare let isConnected: boolean;
declare let currentFeedbackSession: null;
declare let chatConfig: null;
declare let chatHistory: any[];
declare let currentAIMessage: null;
declare let currentAIContent: string;
declare let isApiCalling: boolean;
declare let autoRefreshInterval: null;
declare let autoRefreshCountdown: number;
declare let autoRefreshTimer: null;
declare let lastWorkSummary: null;
declare let sessionTimeoutId: null;
declare let sessionStartTime: null;
declare let sessionTimeoutDuration: number;
declare let autoSubmitWarningShown: boolean;
declare let timeoutWarningId: null;
declare let countdownIntervalId: null;
//# sourceMappingURL=app.d.ts.map