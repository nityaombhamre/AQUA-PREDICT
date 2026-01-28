/**
 * API Client for Water Demand Forecaster
 * Handles all communication with the FastAPI backend
 */

const API_BASE_URL = 'http://localhost:8000';

class APIClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Dashboard Statistics
    async getStats() {
        return this.request('/api/stats');
    }

    // Historical Data
    async getHistoricalData(days = 30, zone = null) {
        let endpoint = `/api/historical?days=${days}`;
        if (zone) endpoint += `&zone=${zone}`;
        return this.request(endpoint);
    }

    // Forecast Data
    async getForecast(days = 7, zone = null) {
        let endpoint = `/api/forecast?days=${days}`;
        if (zone) endpoint += `&zone=${zone}`;
        return this.request(endpoint);
    }

    // Factor Analysis
    async getFactors() {
        return this.request('/api/factors');
    }

    // Alerts
    async getAlerts() {
        return this.request('/api/alerts');
    }

    // Zones Data
    async getZones() {
        return this.request('/api/zones');
    }

    // Model Statistics
    async getModelStats() {
        return this.request('/api/model/stats');
    }

    // Consumption Trends
    async getTrends(period = 'weekly') {
        return this.request(`/api/trends?period=${period}`);
    }

    // Health Check
    async healthCheck() {
        return this.request('/');
    }
}

// Create and export singleton instance
const api = new APIClient();

// Demo data fallback when API is unavailable
const DemoData = {
    stats: {
        current_consumption: 295.5,
        avg_daily_consumption: 287.3,
        peak_consumption: 342.8,
        min_consumption: 245.2,
        total_zones: 6,
        alerts_count: 3,
        forecast_accuracy: 94.5,
        population_index: 1.023,
        trend: 'increasing'
    },

    getHistoricalData(days = 30) {
        const data = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Simulate realistic patterns
            const dayOfWeek = date.getDay();
            const month = date.getMonth();

            let baseConsumption = 280;

            // Weekend effect
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                baseConsumption *= 0.95;
            }

            // Seasonal effect (summer months higher)
            if (month >= 3 && month <= 6) {
                baseConsumption *= 1.15;
            }

            // Random variation
            baseConsumption += (Math.random() - 0.5) * 40;

            // Temperature simulation
            let temp = 28 + Math.sin((month - 3) * Math.PI / 6) * 12;
            temp += (Math.random() - 0.5) * 6;

            data.push({
                date: date.toISOString().split('T')[0],
                consumption: Math.round(baseConsumption * 10) / 10,
                temperature: Math.round(temp * 10) / 10,
                is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
                is_festival: Math.random() < 0.05
            });
        }

        return { data, count: data.length };
    },

    getForecast(days = 7) {
        const predictions = [];
        const today = new Date();
        const lastConsumption = 295;

        for (let i = 1; i <= days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);

            const dayOfWeek = date.getDay();
            let predicted = lastConsumption + (Math.random() - 0.5) * 30;

            // Weekend effect
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                predicted *= 0.92;
            }

            const confidence = Math.max(0.7, 0.95 - i * 0.03);
            const uncertainty = predicted * (1 - confidence) * 0.5;

            predictions.push({
                date: date.toISOString().split('T')[0],
                predicted_consumption: Math.round(predicted * 10) / 10,
                lower_bound: Math.round((predicted - uncertainty) * 10) / 10,
                upper_bound: Math.round((predicted + uncertainty) * 10) / 10,
                confidence: Math.round(confidence * 100) / 100,
                factors: {
                    temperature: Math.round((28 + (Math.random() - 0.5) * 10) * 10) / 10,
                    humidity: Math.round(50 + (Math.random() - 0.5) * 30),
                    precipitation: Math.random() < 0.2 ? Math.round(Math.random() * 20) : 0,
                    is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
                    day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
                    population_index: 1.023
                }
            });
        }

        return { predictions, forecast_days: days };
    },

    getFactors() {
        return {
            factors: [
                { factor_name: 'Temperature', current_value: 32.5, impact_percentage: 28.5, trend: 'increasing' },
                { factor_name: 'Historical Patterns', current_value: 287.3, impact_percentage: 35.2, trend: 'stable' },
                { factor_name: 'Seasonal Pattern', current_value: 1, impact_percentage: 15.8, trend: 'stable' },
                { factor_name: 'Population Growth', current_value: 1.023, impact_percentage: 12.4, trend: 'increasing' },
                { factor_name: 'Precipitation', current_value: 0, impact_percentage: 8.1, trend: 'stable' }
            ]
        };
    },

    getAlerts() {
        return {
            alerts: [
                {
                    id: 'TEMP_HIGH_001',
                    severity: 'high',
                    message: 'Heat alert: Temperature at 38°C. Expected 15-20% increase in water demand.',
                    zone: null,
                    recommendation: 'Increase reservoir releases and activate backup supply.',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'PEAK_DEMAND_001',
                    severity: 'medium',
                    message: 'Peak demand expected tomorrow: 315 MLD',
                    zone: null,
                    recommendation: 'Pre-position mobile water tankers and increase pumping capacity.',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'ZONE_HIGH_Z4',
                    severity: 'medium',
                    message: 'High demand in East Industrial: 85 MLD vs expected 70 MLD',
                    zone: 'Z4',
                    recommendation: 'Increase supply to East Industrial zone.',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'OPTIMIZE_001',
                    severity: 'low',
                    message: 'Daily optimization recommendation available.',
                    zone: null,
                    recommendation: 'Optimize distribution based on current demand: 295 MLD',
                    created_at: new Date().toISOString()
                }
            ],
            total: 4,
            critical: 0,
            high: 1
        };
    },

    getZones() {
        return {
            zones: [
                { zone_id: 'Z1', zone_name: 'Central Business District', population: 250000, industrial_units: 30, current_demand: 48.5, current_supply: 52.0, status: 'normal' },
                { zone_id: 'Z2', zone_name: 'North Residential', population: 400000, industrial_units: 10, current_demand: 57.2, current_supply: 62.0, status: 'normal' },
                { zone_id: 'Z3', zone_name: 'South Residential', population: 350000, industrial_units: 15, current_demand: 52.8, current_supply: 55.0, status: 'normal' },
                { zone_id: 'Z4', zone_name: 'East Industrial', population: 180000, industrial_units: 60, current_demand: 78.3, current_supply: 75.0, status: 'high' },
                { zone_id: 'Z5', zone_name: 'West Commercial', population: 200000, industrial_units: 25, current_demand: 42.1, current_supply: 48.0, status: 'normal' },
                { zone_id: 'Z6', zone_name: 'Old City', population: 300000, industrial_units: 5, current_demand: 36.8, current_supply: 40.0, status: 'normal' }
            ]
        };
    }
};
