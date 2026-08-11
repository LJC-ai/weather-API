/**
 * 全局配置文件
 * Open-Meteo 免费天气 API 配置
 *
 * Open-Meteo 特点：
 * - 完全免费，无需 API Key
 * - 支持全球城市查询
 * - 浏览器直接调用，无 CORS 限制
 * - 官方网站：https://open-meteo.com
 */

const CONFIG = {
    // ========== API 基础地址 ==========
    // 天气数据 API（当前天气 + 预报）
    WEATHER_API_BASE: 'https://api.open-meteo.com',

    // 地理编码 API（城市搜索）
    GEOCODING_API_BASE: 'https://geocoding-api.open-meteo.com',

    // ========== 请求配置 ==========
    // 请求超时时间（毫秒）
    TIMEOUT: 15000,

    // 温度单位: celsius
    TEMP_UNIT: 'celsius',

    // 风速单位: kmh
    WIND_UNIT: 'kmh',

    // 时区自动检测
    TIMEZONE: 'auto',

    // ========== 功能开关 ==========
    // 是否显示空气质量（需要额外参数）
    ENABLE_AIR_QUALITY: false
};