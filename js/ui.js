/**
 * UI 渲染模块
 * 负责将 Open-Meteo 天气数据渲染到 DOM 界面上
 */

// ========== DOM 元素引用 ==========
const DOM = {
    loading: document.getElementById('loading'),
    errorMsg: document.getElementById('errorMsg'),
    errorText: document.getElementById('errorText'),
    retryBtn: document.getElementById('retryBtn'),
    weatherContent: document.getElementById('weatherContent'),
    cityName: document.getElementById('cityName'),
    updateTime: document.getElementById('updateTime'),
    tempNow: document.getElementById('tempNow'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherText: document.getElementById('weatherText'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windDir: document.getElementById('windDir'),
    windScale: document.getElementById('windScale'),
    visibility: document.getElementById('visibility'),
    pressure: document.getElementById('pressure'),
    forecastList: document.getElementById('forecastList'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    locateBtn: document.getElementById('locateBtn')
};

// ========== 状态显示控制 ==========

/**
 * 显示加载状态
 */
function showLoading() {
    DOM.loading.classList.remove('hidden');
    DOM.errorMsg.classList.add('hidden');
    DOM.weatherContent.classList.add('hidden');
}

/**
 * 显示天气内容
 */
function showWeather() {
    DOM.loading.classList.add('hidden');
    DOM.errorMsg.classList.add('hidden');
    DOM.weatherContent.classList.remove('hidden');
}

/**
 * 显示错误信息
 * @param {string} msg - 错误描述
 */
function showError(msg) {
    DOM.loading.classList.add('hidden');
    DOM.weatherContent.classList.add('hidden');
    DOM.errorMsg.classList.remove('hidden');
    DOM.errorText.textContent = msg;
}

// ========== 天气数据渲染 ==========

/**
 * 渲染当前天气卡片
 * @param {Object} current - Open-Meteo 当前天气数据
 * @param {string} cityName - 城市名称
 */
function renderCurrentWeather(current, cityName) {
    // 城市名和更新时间
    DOM.cityName.textContent = cityName || '未知位置';
    DOM.updateTime.textContent = `更新于 ${formatTime(current.time)}`;

    // 温度（取整）
    DOM.tempNow.textContent = Math.round(current.temperature_2m);

    // 天气图标（使用 emoji）和描述
    const isNight = current.is_day === 0;
    const emoji = getWeatherEmoji(current.weather_code, isNight);
    DOM.weatherIcon.textContent = emoji;
    DOM.weatherIcon.className = 'weather-emoji';
    DOM.weatherText.textContent = getWeatherDescription(current.weather_code);

    // 详细信息
    DOM.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
    DOM.humidity.textContent = `${current.relative_humidity_2m}%`;
    DOM.windDir.textContent = getWindDirection(current.wind_direction_10m);
    DOM.windScale.textContent = getWindLevel(current.wind_speed_10m);
    DOM.visibility.textContent = current.cloud_cover !== undefined ? `${current.cloud_cover}%` : '--';
    DOM.pressure.textContent = `${Math.round(current.surface_pressure)}hPa`;
}

/**
 * 渲染 7 日预报列表
 * @param {Object} daily - Open-Meteo 7 天预报数据（各字段为数组）
 */
function renderForecast(daily) {
    // 清空旧数据
    DOM.forecastList.innerHTML = '';

    // 星期映射
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // 遍历每天的数据
    const timeArray = daily.time || [];
    for (let i = 0; i < timeArray.length; i++) {
        const dateStr = timeArray[i];
        const date = new Date(dateStr);
        const weekDay = weekDays[date.getDay()];
        const month = date.getMonth() + 1;
        const dayNum = date.getDate();

        // "今天"特殊标记
        const dayLabel = i === 0 ? '今天' : weekDay;
        const dateLabel = `${month}/${dayNum}`;

        // 读取当天各指标
        const weatherCode = daily.weather_code[i];
        const tempMax = Math.round(daily.temperature_2m_max[i]);
        const tempMin = Math.round(daily.temperature_2m_min[i]);
        const windSpeed = daily.wind_speed_10m_max[i];
        const windDir = daily.wind_direction_10m_dominant[i];

        // 获取天气图标和描述
        const emoji = getWeatherEmoji(weatherCode);
        const desc = getWeatherDescription(weatherCode);
        const windDirText = getWindDirection(windDir);
        const windLevel = getWindLevel(windSpeed);

        // 创建预报项 HTML
        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="forecast-day">
                <span class="day-name">${dayLabel}</span>
                <span class="day-date">${dateLabel}</span>
            </div>
            <div class="forecast-icon">
                <span class="weather-emoji">${emoji}</span>
            </div>
            <div class="forecast-text">
                <span class="text-day">${desc}</span>
            </div>
            <div class="forecast-temp">
                <span class="temp-range">
                    ${tempMax}° / <span class="temp-min">${tempMin}°</span>
                </span>
            </div>
            <div class="forecast-wind">
                <span class="wind-info">${windDirText} ${windLevel}</span>
            </div>
        `;

        DOM.forecastList.appendChild(item);
    }
}

// ========== 工具函数 ==========

/**
 * 格式化时间字符串
 * @param {string} timeStr - ISO 时间字符串
 * @returns {string} - 格式化后的时间 HH:mm
 */
function formatTime(timeStr) {
    if (!timeStr) return '';
    // Open-Meteo 返回格式: "2024-01-15T14:30" 或带时区
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      // 手动解析 ISO 格式
      const parts = timeStr.split('T');
      if (parts.length === 2) {
          return parts[1].substring(0, 5);
      }
      return timeStr;
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}