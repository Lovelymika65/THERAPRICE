/* Live forecast integration for the CropCast prediction screens.
   The rest of the marketplace remains intentionally independent of this
   read-only model API. Set window.THERAPRICE_API_BASE before this file to
   point at a deployed backend; localhost is the development default. */
(function () {
  'use strict';

  const API_BASE = (window.THERAPRICE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const DISPLAY_NAMES = {
    bananas: 'Bananas', beans_fao: 'Beans', cassava_fao: 'Cassava',
    cocoyam_fao: 'Cocoyam', maize: 'Maize', oil: 'Cooking oil',
    plantains_fao: 'Plantains', potatoes_fao: 'Potatoes', rice: 'Rice',
    wheat_flour: 'Wheat flour'
  };
  const PRODUCT_TO_MODEL = {
    'cocoyams': 'cocoyam_fao', 'maize': 'maize',
    'fresh plantains (green/ripe)': 'plantains_fao'
  };

  const apiState = { crops: [], loaded: false, loading: null, data: null };
  const formatMoney = value => `${Math.round(Number(value)).toLocaleString()} FCFA`;
  const isoDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}-01`;
  const byDate = rows => new Map(rows.map(row => [row.date || row.week_start, row]));
  const cropName = stem => DISPLAY_NAMES[stem] || stem.replace(/_/g, ' ');

  async function request(path) {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Forecast API returned ${response.status}`);
    }
    return response.json();
  }

  async function loadCrops() {
    if (apiState.loaded) return apiState.crops;
    if (!apiState.loading) {
      apiState.loading = request('/forecast/crops').then(crops => {
        apiState.crops = crops;
        apiState.loaded = true;
        return crops;
      });
    }
    return apiState.loading;
  }

  async function loadForecast(stem) {
    const [monthly, weekly, daily, yearly] = await Promise.all([
      request(`/forecast/${encodeURIComponent(stem)}?frequency=monthly&include_history=true`),
      request(`/forecast/${encodeURIComponent(stem)}?frequency=weekly`),
      request(`/forecast/${encodeURIComponent(stem)}?frequency=daily`),
      request(`/forecast/${encodeURIComponent(stem)}?frequency=yearly`)
    ]);
    apiState.data = {
      stem,
      monthly: monthly.forecast,
      history: monthly.history || [],
      weekly: weekly.forecast,
      daily: daily.forecast,
      yearly: yearly.forecast,
      model: monthly.model || {},
      viewNotes: monthly.view_notes || {},
      monthlyByDate: byDate(monthly.forecast),
      historyByDate: byDate(monthly.history || []),
      dailyByDate: byDate(daily.forecast),
    };
    return apiState.data;
  }

  function activeProduct() {
    return window.PRODUCTS && PRODUCTS.find(product => product.id === state.predict.cropId);
  }

  function setLoading(message) {
    ['predDayValueBox', 'predWeekList', 'predMonthChart', 'predYearChart'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.innerHTML = `<p style="color:#68736C;padding:18px 0;">${message}</p>`;
    });
  }

  function cropOptions() {
    const selected = state.predict.modelCrop;
    return `<select onchange="apiPredictChangeCrop(this.value)">${apiState.crops.map(item =>
      `<option value="${item.crop}" ${item.crop === selected ? 'selected' : ''}>${cropName(item.crop)}</option>`
    ).join('')}</select>`;
  }

  function modelFilters(includeYear, year) {
    const city = '<select disabled title="City-level model data is not available yet"><option>Cameroon (model scope)</option></select>';
    return `<label>Crop ${cropOptions()}</label><label>City ${city}</label>${includeYear ?
      `<label>Year <select onchange="renderPredYear(Number(this.value))">${yearOptions(year)}</select></label>` : ''}`;
  }

  function yearOptions(selected) {
    const data = apiState.data;
    const years = new Set(data.history.map(row => Number(row.date.slice(0, 4))));
    data.monthly.forEach(row => years.add(Number(row.date.slice(0, 4))));
    return [...years].filter(year => year >= 2020).sort((a, b) => a - b).map(year =>
      `<option value="${year}" ${year === selected ? 'selected' : ''}>${year}</option>`
    ).join('');
  }

  function monthlyPoint(year, month) {
    const data = apiState.data;
    const key = monthKey(year, month);
    const forecast = data.monthlyByDate.get(key);
    if (forecast) return { m: month, price: forecast.predicted_price, actual: false, row: forecast };
    const actual = data.historyByDate.get(key);
    return actual ? { m: month, price: actual.price, actual: true, row: actual } : null;
  }

  function reasonFor(row) {
    return row && row.reason ? row.reason : 'The displayed value comes from the available monthly model data.';
  }

  window.openPrediction = async function (productId) {
    state.predict.cropId = Number(productId);
    state.currentProductId = Number(productId);
    const product = activeProduct();
    setLoading('Loading forecast…');
    go('prediction');
    try {
      const crops = await loadCrops();
      const suggested = product && PRODUCT_TO_MODEL[String(product.name).toLowerCase()];
      const stem = crops.some(item => item.crop === suggested) ? suggested : (state.predict.modelCrop || crops[0].crop);
      state.predict.modelCrop = stem;
      const data = await loadForecast(stem);
      const firstDaily = data.daily[0] && new Date(`${data.daily[0].date}T12:00:00`);
      renderPredDay(firstDaily || new Date());
      if (!suggested && product) toast(`No trained forecast is available for ${product.name}; showing ${cropName(stem)} instead.`);
    } catch (error) {
      setLoading(`Forecasts are unavailable: ${error.message}`);
      toast(`Could not load forecasts. Start the backend on port 8000.`);
    }
  };

  window.apiPredictChangeCrop = async function (stem) {
    setLoading('Loading forecast…');
    try {
      state.predict.modelCrop = stem;
      await loadForecast(stem);
      renderPredDay(new Date(`${apiState.data.daily[0].date}T12:00:00`));
    } catch (error) { toast(`Could not load ${cropName(stem)}: ${error.message}`); }
  };
  window.predictChangeCrop = window.apiPredictChangeCrop;
  window.predictChangeCity = function () { toast('City-level forecasts are not available in the current model data.'); };

  window.renderPredYear = function (year) {
    const data = apiState.data; if (!data) return;
    state.predict.currentYear = year;
    document.getElementById('predYearFilters').innerHTML = modelFilters(true, year);
    document.getElementById('pred-crumb-name').textContent = cropName(data.stem);
    document.getElementById('predYearTitle').textContent = `${year} Price Forecast for ${cropName(data.stem)} in Cameroon`;
    const months = Array.from({ length: 12 }, (_, index) => monthlyPoint(year, index + 1)).filter(Boolean);
    if (!months.length) {
      document.getElementById('predYearInsight').textContent = 'No monthly data is available for this year.';
      document.getElementById('predYearChart').innerHTML = '';
      showPredScreen('Year'); return;
    }
    const forecastMonths = months.filter(month => !month.actual);
    const peak = (forecastMonths.length ? forecastMonths : months).reduce((highest, row) => row.price > highest.price ? row : highest);
    
    // Display overall model accuracy and strategy
    let accuracyHtml = '';
    if (data.model) {
      const wape = data.model.test_wape;
      const improvement = data.model.wape_improvement_percent;
      accuracyHtml = `
        <div style="padding:10px;background:#F0F4FF;border-left:3px solid #2196F3;margin-top:10px;border-radius:4px;">
          <strong>Model Performance:</strong><br>
          Test WAPE (Accuracy): ${(wape * 100).toFixed(2)}% · Improvement vs. baseline: ${improvement ? improvement.toFixed(1) + '%' : 'N/A'}
          <div style="font-size:12px;color:#666;margin-top:5px;">Strategy: ${data.model.deployment_strategy || 'Horizon-specific model selection'}</div>
        </div>
      `;
    }
    
    document.getElementById('predYearInsight').innerHTML = `📈 <b>Prediction:</b> the highest available modelled monthly price is <b>${MONTH_NAMES[peak.m - 1]}</b> (${formatMoney(peak.price)}).${accuracyHtml}`;
    document.getElementById('predYearChart').innerHTML = svgYearChart(months);
    showPredScreen('Year');
  };

  window.renderPredMonth = function (year, month) {
    const data = apiState.data; if (!data) return;
    state.predict.currentYear = year; state.predict.currentMonth = month;
    document.getElementById('predMonthFilters').innerHTML = modelFilters(false, year);
    document.getElementById('pred-crumb-name').textContent = cropName(data.stem);
    document.getElementById('predMonthTitle').textContent = `${MONTH_NAMES[month - 1]} ${year} — ${cropName(data.stem)} Price Prediction`;
    const point = monthlyPoint(year, month);
    const weekRows = data.weekly.filter(row => row.week_start.slice(0, 7) === monthKey(year, month).slice(0, 7));
    const prices = weekRows.map(row => row.predicted_price);
    
    // Display model selections for each horizon with accuracy info
    let modelSelectionHtml = '';
    if (data.model && data.model.models_by_horizon) {
      modelSelectionHtml = '<div style="margin:15px 0;padding:10px;background:#F5F5F5;border-radius:4px;"><strong>Models Selected by Forecast Horizon:</strong>';
      Object.entries(data.model.models_by_horizon).forEach(([horizon, modelName]) => {
        modelSelectionHtml += `<div style="margin:5px 0;padding:5px;background:white;border-left:2px solid #2196F3;"><strong>Horizon ${horizon} month:</strong> ${modelName}</div>`;
      });
      modelSelectionHtml += '</div>';
    }
    
    document.getElementById('predMonthChart').innerHTML = prices.length ? svgMonthBars(prices) : '<p style="color:#68736C;">Weekly detail is available only inside the three-month forecast horizon.</p>';
    document.getElementById('predMonthRange').innerHTML = (point && !point.actual ? `<strong>${formatMoney(point.row.lower_80)} – ${formatMoney(point.row.upper_80)}</strong>` : (point ? `<strong>${formatMoney(point.price)}</strong> actual monthly observation` : 'Not available')) + modelSelectionHtml;
    const cells = []; const daysInMonth = new Date(year, month, 0).getDate();
    const firstDow = new Date(year, month - 1, 1).getDay();
    for (let index = 0; index < firstDow; index++) cells.push('<div class="pred-cal-cell empty"></div>');
    for (let day = 1; day <= daysInMonth; day++) {
      const row = data.dailyByDate.get(`${monthKey(year, month).slice(0, 8)}${String(day).padStart(2, '0')}`);
      cells.push(row ? `<button type="button" class="pred-cal-cell has-value" onclick="renderPredDay(new Date(${year},${month - 1},${day}))"><span class="pred-day-number">${day}</span><span class="pred-day-price">${Math.round(row.predicted_price).toLocaleString()}</span></button>` : `<button type="button" class="pred-cal-cell disabled" onclick="openPredLimitModal(${point ? point.price : 0})"><span class="pred-day-number">${day}</span></button>`);
    }
    document.getElementById('predMonthCalendar').innerHTML = cells.join('');
    document.getElementById('predMonthAlert').style.display = data.daily.some(row => row.date.slice(0, 7) === monthKey(year, month).slice(0, 7)) ? 'none' : 'flex';
    showPredScreen('Month');
  };

  window.renderPredWeek = function (weekStart) {
    const data = apiState.data; if (!data) return;
    state.predict.currentWeekStart = weekStart;
    document.getElementById('predWeekFilters').innerHTML = modelFilters(false, weekStart.getFullYear());
    const end = addDays(weekStart, 6);
    document.getElementById('predWeekTitle').textContent = `Week of ${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const days = Array.from({ length: 7 }, (_, index) => ({ date: addDays(weekStart, index), row: data.dailyByDate.get(isoDate(addDays(weekStart, index))) }));
    document.getElementById('predWeekList').innerHTML = days.map(item => item.row ? `<div class="pred-week-row" onclick="renderPredDay(new Date('${item.row.date}T12:00:00'))"><span class="pwr-day">${item.date.toLocaleDateString('en-GB', { weekday: 'short' })}<span class="pwr-date">${item.date.getDate()} ${MONTH_NAMES[item.date.getMonth()].slice(0, 3)}</span></span><span class="pwr-trend">●</span><span class="pwr-bar-track"><span class="pwr-bar-fill" style="width:${item.row.confidence_score_percent}%"></span></span><span class="pwr-price">${formatMoney(item.row.predicted_price)}</span></div>` : '').join('') || '<p style="color:#68736C;">No daily display values are available for this week.</p>';
    showPredScreen('Week');
  };

  window.renderPredDay = function (date) {
    const data = apiState.data; if (!data) return;
    const row = data.dailyByDate.get(isoDate(date));
    if (!row) { renderPredMonth(date.getFullYear(), date.getMonth() + 1); return; }
    state.predict.currentDay = date; state.predict.currentYear = date.getFullYear(); state.predict.currentMonth = date.getMonth() + 1;
    document.getElementById('predDayFilters').innerHTML = modelFilters(false, date.getFullYear());
    document.getElementById('pred-crumb-name').textContent = cropName(data.stem);
    document.getElementById('predDayTitle').textContent = fmtPredDate(date);
    document.getElementById('predDayValueBox').innerHTML = `<div class="pred-big-num">${formatMoney(row.predicted_price)}</div><div class="pred-sub-range">80% expected range: ${formatMoney(row.lower_80)} – ${formatMoney(row.upper_80)}</div>`;
    const confidence = Number(row.confidence_score_percent);
    document.getElementById('predDayConfLabel').textContent = `Reliability score: ${confidence}% · 80% interval`;
    const bar = document.getElementById('predDayConfBar'); bar.style.width = `${confidence}%`; bar.style.background = confidence >= 70 ? '#43A047' : confidence >= 40 ? '#B98900' : '#D32F2F';
    
    const selectedModels = data.model.models_by_horizon || {};
    const selectedModel = row.selected_model || selectedModels[String(row.horizon_months)] || 'Not recorded';
    const mape = data.model.test_mape;
    const wape = data.model.test_wape;
    document.getElementById('predModelMetrics').innerHTML = `<b>Selected model:</b> ${selectedModel} · <b>Horizon:</b> ${row.horizon_months} month${row.horizon_months === 1 ? '' : 's'} · <b>Reliability:</b> ${confidence}% · <b>Held-out MAPE:</b> ${mape == null ? 'Not available' : `${Number(mape).toFixed(1)}%`} · <b>WAPE:</b> ${wape == null ? 'Not available' : `${Number(wape).toFixed(1)}%`}`;
    
    const strip = [-1, 0, 1].map(offset => {
      const item = data.dailyByDate.get(isoDate(addDays(date, offset)));
      return `<div class="pred-strip-item"><div class="psi-label">${offset === 0 ? 'Selected day' : offset < 0 ? 'Previous day' : 'Next day'}</div><div class="psi-icon">●</div><div class="psi-price">${item ? formatMoney(item.predicted_price) : '—'}</div></div>`;
    });
    document.getElementById('predDayStrip').innerHTML = strip.join('');
    const why = reasonFor(row);
    document.getElementById('predDayWhySupply').textContent = why;
    document.getElementById('predDayWhySeason').textContent = 'Seasonal timing is included in the monthly model.';
    document.getElementById('predDayWhyWeather').textContent = 'No weather claim is shown because weather is not a current model input.';
    document.getElementById('predDayWhyDemand').textContent = 'Available market-factor and price-history signals are used where present.';
    document.getElementById('predDayTip').textContent = 'Theraprice tip: use the predicted range, not only the central price, when deciding when to buy or sell.';
    showPredScreen('Day');
  };

  window.predGoTab = function (tab) {
    const date = state.predict.currentDay || new Date(`${apiState.data.daily[0].date}T12:00:00`);
    if (tab === 'day') renderPredDay(date);
    else if (tab === 'week') renderPredWeek(startOfWeek(date));
    else if (tab === 'month') renderPredMonth(date.getFullYear(), date.getMonth() + 1);
    else renderPredYear(state.predict.currentYear || date.getFullYear());
  };
  window.predDayBack = function () { renderPredWeek(startOfWeek(state.predict.currentDay)); };
  window.predWeekBack = function () { const day = state.predict.currentWeekStart; renderPredMonth(day.getFullYear(), day.getMonth() + 1); };
  window.predMonthBack = function () { renderPredYear(state.predict.currentYear); };
  window.predYearBack = function () { go('marketplace'); };
  
  // Threshold Alert System
  window.openThresholdAlertModal = function(currentPrice, crop) {
    if (!state.alerts) state.alerts = {};
    const alertsForCrop = state.alerts[crop] || [];
    const html = `
      <div style="padding:20px;max-width:500px;">
        <h3 style="margin-top:0;">Price Alert for ${cropName(crop)}</h3>
        <p style="color:#666;">Current predicted price: <strong>${formatMoney(currentPrice)}</strong></p>
        <div style="margin:15px 0;">
          <label style="display:block;margin-bottom:8px;">
            <input type="radio" name="alert-type" value="above" onchange="updateAlertType('above')" checked> Alert when price <strong>rises above</strong>
          </label>
          <label style="display:block;">
            <input type="radio" name="alert-type" value="below" onchange="updateAlertType('below')"> Alert when price <strong>falls below</strong>
          </label>
        </div>
        <div style="margin:15px 0;">
          <label style="display:block;margin-bottom:5px;">Price threshold (FCFA):</label>
          <input type="number" id="alert-threshold" value="${Math.round(currentPrice * 1.1)}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;" placeholder="Enter price">
        </div>
        <div style="margin:15px 0;">
          <label style="display:block;margin-bottom:5px;">Notification method:</label>
          <label style="display:block;margin-bottom:5px;"><input type="checkbox" checked> In-app notification</label>
          <label style="display:block;"><input type="checkbox" ${state.loggedIn ? 'checked' : 'disabled'} title="You must log in to enable SMS alerts"> SMS (if available)</label>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">
          <button type="button" onclick="closeModal()" style="padding:8px 16px;background:#ccc;border:none;border-radius:4px;cursor:pointer;">Cancel</button>
          <button type="button" onclick="saveThresholdAlert('${crop}', ${currentPrice})" style="padding:8px 16px;background:#43A047;color:white;border:none;border-radius:4px;cursor:pointer;">Set Alert</button>
        </div>
      </div>
    `;
    showModal(html, 'Threshold Alert');
  };
  
  window.updateAlertType = function(type) {
    state.alertType = type;
  };
  
  window.saveThresholdAlert = function(crop, currentPrice) {
    if (!state.alerts) state.alerts = {};
    if (!state.alerts[crop]) state.alerts[crop] = [];
    
    const threshold = Number(document.getElementById('alert-threshold').value);
    const type = state.alertType || 'above';
    
    if (!threshold || threshold <= 0) {
      alert('Please enter a valid price threshold');
      return;
    }
    
    const alert = {
      id: Date.now(),
      crop,
      currentPrice,
      threshold,
      type,
      createdAt: new Date().toLocaleString(),
      triggered: false
    };
    
    state.alerts[crop].push(alert);
    localStorage.setItem('theraprice_price_alerts', JSON.stringify(state.alerts));
    
    closeModal();
    toast(`✅ Alert set: ${cropName(crop)} price will alert when it ${type === 'above' ? 'rises above' : 'falls below'} ${formatMoney(threshold)}`);
    
    // Show current active alerts
    displayActiveAlerts(crop);
  };
  
  window.displayActiveAlerts = function(crop) {
    if (!state.alerts || !state.alerts[crop]) return;
    const alerts = state.alerts[crop];
    const alertsHtml = alerts.map(alert => `
      <div style="padding:10px;background:#E8F5E9;border:1px solid #43A047;border-radius:4px;margin:5px 0;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${cropName(crop)}</strong> - Alert if ${alert.type === 'above' ? '↑' : '↓'} ${formatMoney(alert.threshold)}
          <div style="font-size:12px;color:#666;">Set on ${alert.createdAt}</div>
        </div>
        <button type="button" onclick="removeThresholdAlert('${crop}', ${alert.id})" style="padding:4px 8px;background:#D32F2F;color:white;border:none;border-radius:3px;cursor:pointer;font-size:12px;">Remove</button>
      </div>
    `).join('');
    
    const container = document.getElementById('predDayAlerts');
    if (container) {
      container.innerHTML = alertsHtml || '';
      container.style.display = alerts.length ? 'block' : 'none';
    }
  };
  
  window.removeThresholdAlert = function(crop, alertId) {
    if (!state.alerts || !state.alerts[crop]) return;
    state.alerts[crop] = state.alerts[crop].filter(a => a.id !== alertId);
    localStorage.setItem('theraprice_price_alerts', JSON.stringify(state.alerts));
    displayActiveAlerts(crop);
    toast('Alert removed');
  };
  
  // Load alerts from localStorage on startup
  window.initAlerts = function() {
    try {
      const saved = localStorage.getItem('theraprice_price_alerts');
      if (saved) state.alerts = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    }
  };
  // Persist model-threshold alerts through the backend rather than browser storage.
  window.openAlertModal = function () {
    const data = apiState.data;
    if (!data) { toast('Load a forecast before setting an alert.'); return; }
    const selected = data.dailyByDate.get(isoDate(state.predict.currentDay)) || data.daily[0];
    document.getElementById('alertModalSub').textContent = `Get an alert when the ${cropName(data.stem)} forecast crosses your chosen FCFA threshold.`;
    document.getElementById('alertPhone').value = state.phone || '';
    document.getElementById('alertThreshold').value = Math.round(selected.predicted_price);
    document.getElementById('alertModal').classList.add('open');
  };

  window.submitAlert = async function () {
    const data = apiState.data;
    const threshold = Number(document.getElementById('alertThreshold').value);
    const direction = document.getElementById('alertDirection').value;
    if (!data || !Number.isFinite(threshold) || threshold <= 0) { toast('Enter a positive FCFA threshold.'); return; }
    if (!state.phone) { toast('Log in before setting a price alert.'); return; }
    try {
      const response = await fetch(`${API_BASE}/forecast-alerts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: state.phone, crop_name: data.stem, threshold_price: threshold, direction, frequency: 'daily' })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Unable to create alert');
      document.getElementById('alertModal').classList.remove('open');
      toast(result.triggered ? `Alert triggered: forecast already crosses ${formatMoney(threshold)}.` : `Alert saved for ${cropName(data.stem)} at ${formatMoney(threshold)}.`);
    } catch (error) { toast(`Could not save alert: ${error.message}`); }
  };
}());
