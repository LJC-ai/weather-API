/**
 * 天气 API 模块
 * 基于 Open-Meteo 免费天气 API 实现
 *
 * Open-Meteo API 文档：https://open-meteo.com/en/docs
 * - 完全免费，无需 API Key
 * - 支持全球城市搜索、当前天气、7天预报
 * - 浏览器直接调用，无 CORS 限制
 */

// ========== 通用 HTTP 请求封装 ==========

/**
 * 通用 HTTP GET 请求
 * @param {string} url - 完整 URL
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} - 解析后的 JSON 数据
 */
async function fetchAPI(url, params) {
    // 构建查询字符串
    const queryString = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // 超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    try {
        const response = await fetch(fullUrl, {
            signal: controller.signal,
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: 请求失败`);
        }

        return await response.json();
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('请求超时，请检查网络连接');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ========== 地理编码 API（城市搜索） ==========

/**
 * 城市名称搜索（模糊匹配）
 * @param {string} keyword - 城市名称（支持中文、英文、拼音）
 * @returns {Promise<Array>} - 城市匹配列表
 */
async function searchCity(keyword) {
    const params = {
        name: keyword,
        count: 10,           // 返回最多 10 条结果
        language: 'zh',      // 中文返回
        format: 'json'
    };

    const data = await fetchAPI(
        `${CONFIG.GEOCODING_API_BASE}/v1/search`,
        params
    );

    // Open-Meteo 返回 results 数组
    return data.results || [];
}

// ========== 天气 API ==========

/**
 * 获取当前天气数据
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {Promise<Object>} - 当前天气数据
 */
async function getCurrentWeather(lat, lon) {
    const params = {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover',
        temperature_unit: CONFIG.TEMP_UNIT,
        wind_speed_unit: CONFIG.WIND_UNIT,
        timeformat: 'iso8601',
        timezone: CONFIG.TIMEZONE
    };

    const data = await fetchAPI(
        `${CONFIG.WEATHER_API_BASE}/v1/forecast`,
        params
    );

    return data.current;
}

/**
 * 获取未来 7 天天气预报
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {Promise<Object>} - 7 天预报数据
 */
async function get7DayForecast(lat, lon) {
    const params = {
        latitude: lat,
        longitude: lon,
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant',
        temperature_unit: CONFIG.TEMP_UNIT,
        wind_speed_unit: CONFIG.WIND_UNIT,
        timezone: CONFIG.TIMEZONE,
        forecast_days: 7
    };

    const data = await fetchAPI(
        `${CONFIG.WEATHER_API_BASE}/v1/forecast`,
        params
    );

    return data.daily;
}

/**
 * 一次性获取当前天气 + 7日预报
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {Promise<Object>} - 包含 current 和 daily 的原始 API 响应
 */
async function getWeatherAll(lat, lon) {
    // 一次请求同时获取当前天气和7天预报（Open-Meteo 支持组合请求）
    const params = {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant',
        temperature_unit: CONFIG.TEMP_UNIT,
        wind_speed_unit: CONFIG.WIND_UNIT,
        timezone: CONFIG.TIMEZONE,
        forecast_days: 7
    };

    const data = await fetchAPI(
        `${CONFIG.WEATHER_API_BASE}/v1/forecast`,
        params
    );

    return {
        current: data.current,
        daily: data.daily
    };
}

// ========== 天气代码映射 ==========

/**
 * WMO 天气代码转中文描述
 * 参考: https://open-meteo.com/en/docs
 * @param {number} code - WMO 天气代码
 * @returns {string} - 中文天气描述
 */
function getWeatherDescription(code) {
    const weatherMap = {
        0: '晴',
        1: '大部晴朗',
        2: '多云',
        3: '阴',
        45: '雾',
        48: '雾凇',
        51: '小毛毛雨',
        53: '毛毛雨',
        55: '大毛毛雨',
        56: '冻毛毛雨',
        57: '强冻毛毛雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        66: '冻雨',
        67: '强冻雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        77: '雪粒',
        80: '小阵雨',
        81: '中阵雨',
        82: '强阵雨',
        85: '小阵雪',
        86: '强阵雪',
        95: '雷暴',
        96: '雷暴伴小冰雹',
        99: '雷暴伴大冰雹'
    };
    return weatherMap[code] || '未知';
}

/**
 * WMO 天气代码转图标 CSS 类名
 * 使用 emoji 作为天气图标（无需额外依赖）
 * @param {number} code - WMO 天气代码
 * @returns {string} - emoji 图标
 */
function getWeatherEmoji(code, isNight = false) {
    const emojiMap = {
        0: '☀️',   // 晴
        1: '🌤️',   // 大部晴朗
        2: '⛅',    // 多云
        3: '☁️',    // 阴
        45: '🌫️',   // 雾
        48: '🌫️',   // 雾凇
        51: '🌦️',   // 小毛毛雨
        53: '🌦️',   // 毛毛雨
        55: '🌧️',   // 大毛毛雨
        56: '🌧️',   // 冻毛毛雨
        57: '🌧️',   // 强冻毛毛雨
        61: '🌧️',   // 小雨
        63: '🌧️',   // 中雨
        65: '🌧️',   // 大雨
        66: '🌧️',   // 冻雨
        67: '🌧️',   // 强冻雨
        71: '🌨️',   // 小雪
        73: '🌨️',   // 中雪
        75: '❄️',   // 大雪
        77: '🌨️',   // 雪粒
        80: '🌦️',   // 小阵雨
        81: '🌧️',   // 中阵雨
        82: '⛈️',    // 强阵雨
        85: '🌨️',   // 小阵雪
        86: '❄️',   // 强阵雪
        95: '⛈️',    // 雷暴
        96: '⛈️',    // 雷暴伴小冰雹
        99: '⛈️'    // 雷暴伴大冰雹
    };

    // 夜间图标简化处理
    if (isNight && (code === 0 || code === 1)) {
        return '🌙';
    }

    return emojiMap[code] || '🌡️';
}

/**
 * 风力等级估算（基于 km/h 风速）
 * @param {number} speed - 风速 km/h
 * @returns {string} - 风力描述
 */
function getWindLevel(speed) {
    if (speed < 1) return '0级（无风）';
    if (speed < 6) return '1级（软风）';
    if (speed < 12) return '2级（轻风）';
    if (speed < 20) return '3级（微风）';
    if (speed < 29) return '4级（和风）';
    if (speed < 39) return '5级（清风）';
    if (speed < 50) return '6级（强风）';
    if (speed < 62) return '7级（疾风）';
    if (speed < 75) return '8级（大风）';
    return '9级+（烈风）';
}

/**
 * 风向角度转中文描述
 * @param {number} direction - 风向角度（度）
 * @returns {string} - 中文风向
 */
function getWindDirection(direction) {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const index = Math.round(direction / 45) % 8;
    return directions[index];
}