/**
 * Main Application for Water Demand Forecaster
 * Handles initialization, navigation, data loading, and UI updates
 */

class WaterDemandApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.historicalData = [];
        this.forecastData = [];
        this.zonesData = [];
        this.alertsData = [];
        this.stats = {};
        this.useDemo = false; // Will switch to true if API fails
        this.chartRange = 7;
    }

    // Initialize the application
    async init() {
        console.log('Initializing Water Demand Forecaster...');

        // Set current date
        this.updateDate();

        // Setup event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadAllData();

        // Hide loading overlay
        this.hideLoading();

        console.log('Application initialized successfully!');
    }

    // Update date display
    updateDate() {
        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = new Date().toLocaleDateString('en-US', options);
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateTo(section);
            });
        });

        // View all links
        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.navigateTo(section);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Chart range buttons
        document.querySelectorAll('.chart-btn[data-range]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.chartRange = parseInt(btn.dataset.range);
                this.updateConsumptionChart();
            });
        });

        // Forecast days selector
        const forecastDays = document.getElementById('forecast-days');
        if (forecastDays) {
            forecastDays.addEventListener('change', () => {
                this.loadForecast(parseInt(forecastDays.value));
            });
        }

        // Alert filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterAlerts(btn.dataset.filter);
            });
        });
    }

    // Navigate to a section
    navigateTo(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `${section}-section`);
        });

        // Update page title
        const titles = {
            'dashboard': 'Dashboard Overview',
            'forecast': 'Water Demand Forecast',
            'zones': 'Distribution Zones',
            'analytics': 'Advanced Analytics',
            'alerts': 'Alerts & Recommendations'
        };
        document.getElementById('page-title').textContent = titles[section] || 'Dashboard';

        this.currentSection = section;

        // Load section-specific data
        this.loadSectionData(section);
    }

    // Load data for specific section
    async loadSectionData(section) {
        switch (section) {
            case 'analytics':
                this.updateAnalyticsCharts();
                break;
            case 'forecast':
                const days = parseInt(document.getElementById('forecast-days')?.value || 7);
                await this.loadForecast(days);
                break;
            case 'zones':
                await this.loadZones();
                break;
            case 'alerts':
                await this.loadAlerts();
                break;
        }
    }

    // Load all data
    async loadAllData() {
        try {
            // Try API first
            await api.healthCheck();
            this.useDemo = false;
            console.log('API connected successfully');
        } catch (error) {
            console.warn('API not available, using demo data');
            this.useDemo = true;
        }

        await Promise.all([
            this.loadStats(),
            this.loadHistoricalData(),
            this.loadForecast(7),
            this.loadFactors(),
            this.loadAlerts(),
            this.loadZones()
        ]);

        // Update all UI components
        this.updateDashboard();
    }

    // Refresh all data
    async refreshData() {
        const btn = document.getElementById('refresh-btn');
        btn.classList.add('loading');

        await this.loadAllData();

        setTimeout(() => {
            btn.classList.remove('loading');
        }, 500);
    }

    // Load dashboard stats
    async loadStats() {
        try {
            this.stats = this.useDemo ? DemoData.stats : await api.getStats();
        } catch (error) {
            console.error('Error loading stats:', error);
            this.stats = DemoData.stats;
        }
    }

    // Load historical data
    async loadHistoricalData() {
        try {
            const response = this.useDemo
                ? DemoData.getHistoricalData(90)
                : await api.getHistoricalData(90);
            this.historicalData = response.data;
        } catch (error) {
            console.error('Error loading historical data:', error);
            this.historicalData = DemoData.getHistoricalData(90).data;
        }
    }

    // Load forecast
    async loadForecast(days = 7) {
        try {
            const response = this.useDemo
                ? DemoData.getForecast(days)
                : await api.getForecast(days);
            this.forecastData = response.predictions;
            this.updateForecastUI();
        } catch (error) {
            console.error('Error loading forecast:', error);
            this.forecastData = DemoData.getForecast(days).predictions;
            this.updateForecastUI();
        }
    }

    // Load factors
    async loadFactors() {
        try {
            const response = this.useDemo
                ? DemoData.getFactors()
                : await api.getFactors();
            this.factorsData = response.factors;
        } catch (error) {
            console.error('Error loading factors:', error);
            this.factorsData = DemoData.getFactors().factors;
        }
    }

    // Load alerts
    async loadAlerts() {
        try {
            const response = this.useDemo
                ? DemoData.getAlerts()
                : await api.getAlerts();
            this.alertsData = response.alerts;
            this.updateAlertBadge(response);
            this.renderAlerts();
        } catch (error) {
            console.error('Error loading alerts:', error);
            const demoAlerts = DemoData.getAlerts();
            this.alertsData = demoAlerts.alerts;
            this.updateAlertBadge(demoAlerts);
            this.renderAlerts();
        }
    }

    // Load zones
    async loadZones() {
        try {
            const response = this.useDemo
                ? DemoData.getZones()
                : await api.getZones();
            this.zonesData = response.zones;
            this.renderZones();
        } catch (error) {
            console.error('Error loading zones:', error);
            this.zonesData = DemoData.getZones().zones;
            this.renderZones();
        }
    }

    // Update dashboard UI
    updateDashboard() {
        // Update stat cards
        this.animateValue('current-demand', this.stats.current_consumption);
        this.animateValue('avg-demand', this.stats.avg_daily_consumption);
        this.animateValue('peak-demand', this.stats.peak_consumption);
        this.animateValue('model-accuracy', this.stats.forecast_accuracy);

        // Update trend indicator
        const trendEl = document.getElementById('demand-trend');
        if (trendEl && this.stats.trend) {
            const isUp = this.stats.trend === 'increasing';
            trendEl.classList.toggle('up', isUp);
            trendEl.classList.toggle('down', !isUp && this.stats.trend === 'decreasing');
            trendEl.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="${isUp ? 'M23 6l-9.5 9.5-5-5L1 18' : 'M23 18l-9.5-9.5-5 5L1 6'}"/>
                </svg>
                <span>${isUp ? '↑' : '↓'} ${this.stats.trend}</span>
            `;
        }

        // Update charts
        this.updateConsumptionChart();
        this.updateFactorsChart();
        this.updateForecastPreview();
    }

    // Animate number value
    animateValue(elementId, targetValue) {
        const el = document.getElementById(elementId);
        if (!el || typeof targetValue !== 'number') return;

        const start = parseFloat(el.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = start + (targetValue - start) * easeProgress;

            el.textContent = currentValue.toFixed(1);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Update consumption chart
    updateConsumptionChart() {
        const data = this.historicalData.slice(-this.chartRange);
        chartManager.createConsumptionChart('consumption-chart', data);
    }

    // Update factors chart
    updateFactorsChart() {
        if (this.factorsData) {
            chartManager.createFactorsChart('factors-chart', this.factorsData);
        }
    }

    // Update forecast preview
    updateForecastPreview() {
        const container = document.getElementById('forecast-preview-cards');
        if (!container || !this.forecastData) return;

        const preview = this.forecastData.slice(0, 7);
        container.innerHTML = preview.map((pred, idx) => {
            const date = new Date(pred.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

            return `
                <div class="forecast-day ${idx === 0 ? 'today' : ''}">
                    <div class="day-name">${dayName}</div>
                    <div class="day-date">${dayNum}</div>
                    <div class="day-value">${pred.predicted_consumption.toFixed(0)}</div>
                    <div class="day-unit">MLD</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${pred.confidence * 100}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update forecast UI (full page)
    updateForecastUI() {
        // Update chart
        if (this.currentSection === 'forecast' || this.currentSection === 'dashboard') {
            chartManager.createForecastChart('forecast-chart', this.forecastData);
        }

        // Update table
        const tbody = document.getElementById('forecast-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.forecastData.map(pred => {
            const date = new Date(pred.date);
            const confidenceClass = pred.confidence >= 0.85 ? 'high' : pred.confidence >= 0.7 ? 'medium' : 'low';

            return `
                <tr>
                    <td>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>${pred.factors.day_of_week}</td>
                    <td class="highlight">${pred.predicted_consumption.toFixed(1)}</td>
                    <td>${pred.lower_bound.toFixed(1)} - ${pred.upper_bound.toFixed(1)}</td>
                    <td><span class="confidence-badge ${confidenceClass}">${(pred.confidence * 100).toFixed(0)}%</span></td>
                    <td>${pred.factors.temperature}°C</td>
                    <td>${pred.factors.is_weekend ? '✓' : '-'}</td>
                </tr>
            `;
        }).join('');

        // Also update preview if on dashboard
        this.updateForecastPreview();
    }

    // Update analytics charts
    updateAnalyticsCharts() {
        if (this.historicalData.length > 0) {
            chartManager.createMonthlyChart('monthly-chart', this.historicalData);
            chartManager.createWeeklyChart('weekly-chart', this.historicalData);
            chartManager.createCorrelationChart('correlation-chart', this.historicalData);
        }
    }

    // Render zones grid
    renderZones() {
        const container = document.getElementById('zones-grid');
        if (!container) return;

        container.innerHTML = this.zonesData.map(zone => {
            const utilizationPercent = (zone.current_demand / zone.current_supply * 100).toFixed(0);
            const isWarning = utilizationPercent > 95;

            return `
                <div class="zone-card">
                    <div class="zone-header">
                        <div>
                            <div class="zone-name">${zone.zone_name}</div>
                            <div class="zone-id">${zone.zone_id}</div>
                        </div>
                        <span class="zone-status ${zone.status}">${zone.status}</span>
                    </div>
                    <div class="zone-metrics">
                        <div class="zone-metric">
                            <span class="metric-label">Population</span>
                            <span class="metric-value">${(zone.population / 1000).toFixed(0)}K</span>
                        </div>
                        <div class="zone-metric">
                            <span class="metric-label">Industrial</span>
                            <span class="metric-value">${zone.industrial_units}%</span>
                        </div>
                        <div class="zone-metric">
                            <span class="metric-label">Demand</span>
                            <span class="metric-value">${zone.current_demand.toFixed(1)} MLD</span>
                        </div>
                        <div class="zone-metric">
                            <span class="metric-label">Supply</span>
                            <span class="metric-value">${zone.current_supply.toFixed(1)} MLD</span>
                        </div>
                    </div>
                    <div class="zone-progress">
                        <div class="progress-label">
                            <span>Utilization</span>
                            <span>${utilizationPercent}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${isWarning ? 'warning' : ''}" style="width: ${Math.min(utilizationPercent, 100)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render alerts
    renderAlerts(filter = 'all') {
        const container = document.getElementById('alerts-list');
        if (!container) return;

        const filtered = filter === 'all'
            ? this.alertsData
            : this.alertsData.filter(a => a.severity === filter);

        container.innerHTML = filtered.map(alert => {
            const timeAgo = this.getTimeAgo(new Date(alert.created_at));

            return `
                <div class="alert-item ${alert.severity}">
                    <div class="alert-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${this.getAlertIcon(alert.severity)}
                        </svg>
                    </div>
                    <div class="alert-content">
                        <h4>
                            ${alert.message}
                            <span class="alert-severity">${alert.severity}</span>
                        </h4>
                        ${alert.zone ? `<p>Zone: ${alert.zone}</p>` : ''}
                        <div class="alert-recommendation">
                            <span>Recommendation</span>
                            <p>${alert.recommendation}</p>
                        </div>
                    </div>
                    <div class="alert-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
    }

    // Filter alerts
    filterAlerts(filter) {
        this.renderAlerts(filter);
    }

    // Update alert badge
    updateAlertBadge(alertData) {
        const badge = document.getElementById('alert-badge');
        if (badge) {
            const count = alertData.critical + alertData.high;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    // Get alert icon SVG path
    getAlertIcon(severity) {
        switch (severity) {
            case 'critical':
                return '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
            case 'high':
                return '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
            case 'medium':
                return '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>';
            default:
                return '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>';
        }
    }

    // Get relative time
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 500);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new WaterDemandApp();
    app.init();
});
