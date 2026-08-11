/**
 * 应用主逻辑模块
 * 负责：初始化、定位、搜索、数据加载与错误处理
 *
 * 使用 Open-Meteo 免费天气 API（无需 Key）
 *
 * 执行流程：
 * 1. 绑定 UI 事件
 * 2. 尝试浏览器自动定位
 * 3. 定位失败则引导用户手动搜索
 * 4. 加载天气数据并渲染
 */

// ========== 全局状态 ==========
const App = {
    // 当前加载的位置信息
    currentLocation: null,  // { name, lat, lon }
    // 是否正在加载（防止重复请求）
    isLoading: false
};

// ========== 应用初始化 ==========

/**
 * 应用启动入口
 */
function initApp() {
    // 绑定事件监听
    bindEvents();

    // 检查定位权限并尝试自动定位
    checkGeoPermission()
        .then(permission => {
            if (permission === 'granted' || permission === 'prompt') {
                // 已有权限或可询问，直接定位
                autoLocate();
            } else {
                // 已拒绝，提示用户手动搜索
                showError('定位权限被拒绝，请手动输入城市名称进行搜索');
            }
        })
        .catch(() => {
            // 浏览器不支持 Geolocation
            showError('当前浏览器不支持定位，请手动输入城市名称');
        });
}

/**
 * 绑定所有 UI 事件
 */
function bindEvents() {
    // 搜索按钮点击
    DOM.searchBtn.addEventListener('click', handleSearch);

    // 搜索框回车事件
    DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 搜索框输入时清除错误
    DOM.searchInput.addEventListener('input', () => {
        if (!DOM.searchInput.value.trim()) {
            hideError();
        }
    });

    // 定位按钮点击
    DOM.locateBtn.addEventListener('click', () => {
        DOM.locateBtn.classList.add('loading');
        autoLocate().finally(() => {
            DOM.locateBtn.classList.remove('loading');
        });
    });

    // 重试按钮
    DOM.retryBtn.addEventListener('click', () => {
        hideError();
        if (App.currentLocation) {
            loadWeather(App.currentLocation);
        } else {
            autoLocate();
        }
    });
}

// ========== 定位相关 ==========

/**
 * 检查定位权限状态
 * @returns {Promise<string>} - 权限状态：granted / denied / prompt
 */
function checkGeoPermission() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation 不支持'));
            return;
        }

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' })
                .then(result => resolve(result.state))
                .catch(() => resolve('prompt'));
        } else {
            resolve('prompt');
        }
    });
}

/**
 * 浏览器自动定位（获取经纬度）
 * @returns {Promise<void>}
 */
function autoLocate() {
    return new Promise((resolve, reject) => {
        showLoading();

        if (!navigator.geolocation) {
            showError('当前浏览器不支持定位功能，请手动搜索城市');
            reject(new Error('Geolocation 不支持'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const location = {
                    name: '当前位置',
                    lat: lat,
                    lon: lon
                };

                App.currentLocation = location;
                loadWeather(location);
                resolve(location);
            },
            (error) => {
                const errorMap = {
                    1: '定位权限被拒绝，请在浏览器设置中开启定位权限',
                    2: '定位信息不可用，请检查网络或 GPS 设置',
                    3: '定位请求超时，请重试'
                };
                const errorMsg = errorMap[error.code] || '定位失败，请手动搜索城市';
                showError(errorMsg);
                reject(error);
            },
            options
        );
    });
}

// ========== 城市搜索 ==========

/**
 * 处理搜索操作
 */
async function handleSearch() {
    const keyword = DOM.searchInput.value.trim();
    if (!keyword) {
        DOM.searchInput.focus();
        return;
    }

    showLoading();

    try {
        // 调用 Open-Meteo 地理编码 API 搜索城市
        const results = await searchCity(keyword);

        if (!results || results.length === 0) {
            showError(`未找到与「${keyword}」匹配的城市，请尝试其他名称或英文拼写`);
            return;
        }

        // 取第一个匹配结果（最精确匹配）
        const city = results[0];

        // 构造位置对象
        const location = {
            name: formatCityName(city),
            lat: city.latitude,
            lon: city.longitude
        };

        App.currentLocation = location;
        loadWeather(location);

    } catch (err) {
        showError(`搜索失败：${err.message}`);
    }
}

/**
 * 格式化城市名称
 * @param {Object} city - Open-Meteo 地理编码数据
 * @returns {string} - 格式化后的名称
 */
function formatCityName(city) {
    // Open-Meteo 地理编码返回: name, admin1, admin2, country
    const parts = [];
    if (city.admin1 && city.admin1 !== city.name) {
        parts.push(city.admin1);
    }
    if (city.admin2) {
        parts.push(city.admin2);
    }
    parts.push(city.name);

    // 去除重复项
    return parts.filter((v, i, a) => a.indexOf(v) === i).join(' · ');
}

// ========== 数据加载 ==========

/**
 * 加载指定位置的天气数据
 * @param {Object} location - 位置对象 { name, lat, lon }
 */
async function loadWeather(location) {
    if (App.isLoading) return;
    App.isLoading = true;

    showLoading();

    try {
        // 使用 Open-Meteo 一次获取当前天气 + 7日预报
        const { current, daily } = await getWeatherAll(location.lat, location.lon);

        // 渲染数据
        renderCurrentWeather(current, location.name);
        renderForecast(daily);

        showWeather();

    } catch (err) {
        showError(`天气数据获取失败：${err.message}`);
    } finally {
        App.isLoading = false;
    }
}

// ========== 工具函数 ==========

/**
 * 隐藏错误信息
 */
function hideError() {
    DOM.errorMsg.classList.add('hidden');
}

// ========== DOM 就绪后启动 ==========
document.addEventListener('DOMContentLoaded', initApp);