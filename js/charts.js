/**
 * Chart Configurations for Water Demand Forecaster
 * Uses Chart.js for interactive visualizations
 */

// Chart color schemes
const ChartColors = {
    primary: {
        main: 'rgba(59, 130, 246, 1)',
        light: 'rgba(59, 130, 246, 0.2)',
        gradient: ['rgba(59, 130, 246, 0.8)', 'rgba(6, 182, 212, 0.8)']
    },
    success: {
        main: 'rgba(34, 197, 94, 1)',
        light: 'rgba(34, 197, 94, 0.2)'
    },
    warning: {
        main: 'rgba(245, 158, 11, 1)',
        light: 'rgba(245, 158, 11, 0.2)'
    },
    error: {
        main: 'rgba(239, 68, 68, 1)',
        light: 'rgba(239, 68, 68, 0.2)'
    },
    purple: {
        main: 'rgba(139, 92, 246, 1)',
        light: 'rgba(139, 92, 246, 0.2)'
    },
    cyan: {
        main: 'rgba(6, 182, 212, 1)',
        light: 'rgba(6, 182, 212, 0.2)'
    },
    text: {
        primary: 'rgba(248, 250, 252, 1)',
        secondary: 'rgba(148, 163, 184, 1)',
        muted: 'rgba(71, 85, 105, 1)'
    },
    grid: 'rgba(148, 163, 184, 0.1)',
    background: 'rgba(30, 41, 59, 0.8)'
};

// Common chart options
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
                color: ChartColors.text.secondary,
                usePointStyle: true,
                padding: 20,
                font: {
                    family: "'Inter', sans-serif",
                    size: 12
                }
            }
        },
        tooltip: {
            backgroundColor: ChartColors.background,
            titleColor: ChartColors.text.primary,
            bodyColor: ChartColors.text.secondary,
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: {
                family: "'Inter', sans-serif",
                size: 13,
                weight: 600
            },
            bodyFont: {
                family: "'Inter', sans-serif",
                size: 12
            },
            displayColors: true,
            boxPadding: 6
        }
    },
    scales: {
        x: {
            grid: {
                color: ChartColors.grid,
                drawBorder: false
            },
            ticks: {
                color: ChartColors.text.secondary,
                font: {
                    family: "'Inter', sans-serif",
                    size: 11
                }
            }
        },
        y: {
            grid: {
                color: ChartColors.grid,
                drawBorder: false
            },
            ticks: {
                color: ChartColors.text.secondary,
                font: {
                    family: "'Inter', sans-serif",
                    size: 11
                }
            }
        }
    }
};

// Chart manager class
class ChartManager {
    constructor() {
        this.charts = {};
    }

    // Create gradient for chart backgrounds
    createGradient(ctx, colorStart, colorEnd) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    }

    // Consumption Trends Chart
    createConsumptionChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        // Destroy existing chart
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const gradient = this.createGradient(
            ctx.getContext('2d'),
            'rgba(59, 130, 246, 0.3)',
            'rgba(59, 130, 246, 0.0)'
        );

        const labels = data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Consumption (MLD)',
                        data: data.map(d => d.consumption),
                        borderColor: ChartColors.primary.main,
                        backgroundColor: gradient,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: ChartColors.primary.main,
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2
                    },
                    {
                        label: 'Temperature (°C)',
                        data: data.map(d => d.temperature),
                        borderColor: ChartColors.warning.main,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...commonOptions,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Consumption (MLD)',
                            color: ChartColors.text.secondary
                        }
                    },
                    y1: {
                        ...commonOptions.scales.y,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Temperature (°C)',
                            color: ChartColors.text.secondary
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    // Factor Impact Chart (Doughnut)
    createFactorsChart(canvasId, factors) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const colors = [
            ChartColors.primary.main,
            ChartColors.cyan.main,
            ChartColors.purple.main,
            ChartColors.success.main,
            ChartColors.warning.main
        ];

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: factors.map(f => f.factor_name),
                datasets: [{
                    data: factors.map(f => f.impact_percentage),
                    backgroundColor: colors,
                    borderColor: 'rgba(15, 23, 42, 1)',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: ChartColors.text.secondary,
                            usePointStyle: true,
                            padding: 16,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: (context) => {
                                return ` ${context.label}: ${context.raw.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    // Forecast Chart with confidence bands
    createForecastChart(canvasId, predictions) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const labels = predictions.map(p => {
            const date = new Date(p.date);
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Upper Bound',
                        data: predictions.map(p => p.upper_bound),
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: '+1',
                        pointRadius: 0
                    },
                    {
                        label: 'Predicted',
                        data: predictions.map(p => p.predicted_consumption),
                        borderColor: ChartColors.primary.main,
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 6,
                        pointBackgroundColor: ChartColors.primary.main,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Lower Bound',
                        data: predictions.map(p => p.lower_bound),
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: '-1',
                        pointRadius: 0
                    }
                ]
            },
            options: {
                ...commonOptions,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    ...commonOptions.plugins,
                    legend: {
                        ...commonOptions.plugins.legend,
                        labels: {
                            ...commonOptions.plugins.legend.labels,
                            filter: (item) => item.text === 'Predicted'
                        }
                    },
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            afterLabel: (context) => {
                                if (context.datasetIndex === 1) {
                                    const pred = predictions[context.dataIndex];
                                    return [
                                        `Range: ${pred.lower_bound} - ${pred.upper_bound} MLD`,
                                        `Confidence: ${(pred.confidence * 100).toFixed(0)}%`,
                                        `Temperature: ${pred.factors.temperature}°C`
                                    ];
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Consumption (MLD)',
                            color: ChartColors.text.secondary
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    // Monthly Pattern Chart (Bar)
    createMonthlyChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Aggregate by month
        const monthlyData = {};
        data.forEach(d => {
            const month = new Date(d.date).getMonth();
            if (!monthlyData[month]) {
                monthlyData[month] = { total: 0, count: 0 };
            }
            monthlyData[month].total += d.consumption;
            monthlyData[month].count++;
        });

        const averages = months.map((_, i) => {
            if (monthlyData[i]) {
                return Math.round(monthlyData[i].total / monthlyData[i].count * 10) / 10;
            }
            return 0;
        });

        const gradient = this.createGradient(
            ctx.getContext('2d'),
            'rgba(59, 130, 246, 0.8)',
            'rgba(6, 182, 212, 0.8)'
        );

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Avg. Consumption (MLD)',
                    data: averages,
                    backgroundColor: gradient,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false }
                }
            }
        });

        return this.charts[canvasId];
    }

    // Weekly Pattern Chart
    createWeeklyChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Aggregate by day of week
        const weeklyData = Array(7).fill(null).map(() => ({ total: 0, count: 0 }));
        data.forEach(d => {
            const day = new Date(d.date).getDay();
            weeklyData[day].total += d.consumption;
            weeklyData[day].count++;
        });

        const averages = weeklyData.map(d => d.count > 0 ? Math.round(d.total / d.count * 10) / 10 : 0);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Avg. Consumption (MLD)',
                    data: averages,
                    borderColor: ChartColors.primary.main,
                    backgroundColor: ChartColors.primary.light,
                    borderWidth: 2,
                    pointBackgroundColor: ChartColors.primary.main,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    r: {
                        angleLines: {
                            color: ChartColors.grid
                        },
                        grid: {
                            color: ChartColors.grid
                        },
                        pointLabels: {
                            color: ChartColors.text.secondary,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            }
                        },
                        ticks: {
                            color: ChartColors.text.muted,
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    // Temperature vs Consumption Scatter
    createCorrelationChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const scatterData = data.map(d => ({
            x: d.temperature,
            y: d.consumption
        }));

        this.charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Temperature vs Consumption',
                    data: scatterData,
                    backgroundColor: ChartColors.primary.light,
                    borderColor: ChartColors.primary.main,
                    borderWidth: 1,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ...commonOptions.scales.x,
                        title: {
                            display: true,
                            text: 'Temperature (°C)',
                            color: ChartColors.text.secondary
                        }
                    },
                    y: {
                        ...commonOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Consumption (MLD)',
                            color: ChartColors.text.secondary
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    // Destroy all charts
    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Create singleton instance
const chartManager = new ChartManager();
