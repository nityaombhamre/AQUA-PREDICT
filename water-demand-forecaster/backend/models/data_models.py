"""
Data models for Water Demand Forecaster
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class WeatherData(BaseModel):
    """Weather conditions affecting water demand"""
    date: date
    temperature: float  # Celsius
    humidity: float  # Percentage
    precipitation: float  # mm
    is_heatwave: bool = False


class ConsumptionRecord(BaseModel):
    """Historical water consumption record"""
    date: date
    consumption: float  # Million Liters per Day (MLD)
    zone: str
    temperature: Optional[float] = None
    is_festival: bool = False
    is_weekend: bool = False
    population_index: float = 1.0
    industrial_usage: float = 0.0  # MLD


class ForecastResult(BaseModel):
    """Prediction result for a future date"""
    date: date
    predicted_consumption: float  # MLD
    lower_bound: float  # 95% confidence lower
    upper_bound: float  # 95% confidence upper
    factors: dict


class ZoneData(BaseModel):
    """Water distribution zone information"""
    zone_id: str
    zone_name: str
    population: int
    area_sqkm: float
    industrial_units: int
    current_supply: float  # MLD
    current_demand: float  # MLD


class Alert(BaseModel):
    """Water shortage or optimization alert"""
    id: str
    severity: str  # low, medium, high, critical
    message: str
    zone: Optional[str] = None
    recommendation: str
    created_at: datetime


class DashboardStats(BaseModel):
    """Summary statistics for dashboard"""
    current_consumption: float  # MLD
    avg_daily_consumption: float
    peak_consumption: float
    total_zones: int
    alerts_count: int
    forecast_accuracy: float  # Percentage


class FactorAnalysis(BaseModel):
    """Impact analysis of various factors"""
    factor_name: str
    current_value: float
    impact_percentage: float  # How much it affects demand
    trend: str  # increasing, decreasing, stable


class ForecastRequest(BaseModel):
    """Request for forecast generation"""
    days: int = 7
    zone: Optional[str] = None
    include_confidence: bool = True
