"""
Prediction Service - Orchestrates data generation, model training, and predictions
"""
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pandas as pd

from models.forecaster import WaterDemandForecaster
from services.data_generator import DataGenerator


class PredictionService:
    """Service layer for water demand predictions"""
    
    def __init__(self, data_path: str = None):
        self.data_generator = DataGenerator()
        self.forecaster = WaterDemandForecaster()
        self.data_path = data_path or os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'data',
            'historical_data.json'
        )
        self.historical_df = None
        self.city_df = None
        self.zones = self.data_generator.get_zones()
        self._initialized = False
        
    def initialize(self, force_regenerate: bool = False):
        """Initialize service with data and trained model"""
        
        # Ensure data directory exists
        data_dir = os.path.dirname(self.data_path)
        os.makedirs(data_dir, exist_ok=True)
        
        # Load or generate data
        if not force_regenerate and os.path.exists(self.data_path):
            print("Loading existing data...")
            self.historical_df = pd.read_json(self.data_path)
        else:
            print("Generating synthetic data...")
            self.historical_df = self.data_generator.generate_historical_data(days=730)
            self.data_generator.save_to_json(self.historical_df, self.data_path)
        
        # Generate city totals
        self.city_df = self.data_generator.generate_city_totals(self.historical_df)
        
        # Train model
        print("Training forecasting model...")
        self.forecaster.train(self.city_df)
        
        self._initialized = True
        print("Service initialized successfully!")
        
    def ensure_initialized(self):
        """Ensure service is initialized"""
        if not self._initialized:
            self.initialize()
    
    def get_historical_data(
        self,
        days: int = 30,
        zone: Optional[str] = None
    ) -> List[Dict]:
        """Get historical consumption data"""
        self.ensure_initialized()
        
        df = self.historical_df.copy()
        
        if zone:
            df = df[df['zone_id'] == zone]
        else:
            df = self.city_df.copy()
        
        # Get last N days
        df = df.tail(days)
        
        return df.to_dict(orient='records')
    
    def get_forecast(
        self,
        days: int = 7,
        zone: Optional[str] = None
    ) -> List[Dict]:
        """Get water demand forecast"""
        self.ensure_initialized()
        
        predictions = self.forecaster.predict(
            self.city_df,
            days_ahead=days
        )
        
        return predictions
    
    def get_dashboard_stats(self) -> Dict:
        """Get summary statistics for dashboard"""
        self.ensure_initialized()
        
        recent = self.city_df.tail(30)
        today = self.city_df.iloc[-1]
        
        return {
            'current_consumption': round(today['consumption'], 2),
            'avg_daily_consumption': round(recent['consumption'].mean(), 2),
            'peak_consumption': round(recent['consumption'].max(), 2),
            'min_consumption': round(recent['consumption'].min(), 2),
            'total_zones': len(self.zones),
            'alerts_count': self._count_active_alerts(),
            'forecast_accuracy': round(
                (1 - self.forecaster.training_stats.get('mape', 5) / 100) * 100, 1
            ),
            'population_index': round(today['population_index'], 4),
            'trend': self._get_consumption_trend()
        }
    
    def _get_consumption_trend(self) -> str:
        """Calculate consumption trend"""
        if len(self.city_df) < 14:
            return 'stable'
        
        last_week = self.city_df.tail(7)['consumption'].mean()
        prev_week = self.city_df.tail(14).head(7)['consumption'].mean()
        
        change = (last_week - prev_week) / prev_week * 100
        
        if change > 5:
            return 'increasing'
        elif change < -5:
            return 'decreasing'
        return 'stable'
    
    def _count_active_alerts(self) -> int:
        """Count current active alerts"""
        alerts = self.get_alerts()
        return len([a for a in alerts if a['severity'] in ['high', 'critical']])
    
    def get_factor_analysis(self) -> List[Dict]:
        """Get impact analysis of various factors"""
        self.ensure_initialized()
        return self.forecaster.get_factor_impact(self.city_df)
    
    def get_alerts(self) -> List[Dict]:
        """Generate water shortage and optimization alerts"""
        self.ensure_initialized()
        
        alerts = []
        today = self.city_df.iloc[-1]
        forecast = self.get_forecast(days=7)
        
        # Check for high temperature alert
        if today['temperature'] > 40:
            alerts.append({
                'id': 'TEMP_HIGH_001',
                'severity': 'high',
                'message': f"Heat alert: Temperature at {today['temperature']}°C. Expected 15-20% increase in water demand.",
                'zone': None,
                'recommendation': 'Increase reservoir releases and activate backup supply.',
                'created_at': datetime.now().isoformat()
            })
        
        # Check for predicted peak demand
        avg_consumption = self.city_df['consumption'].tail(30).mean()
        for pred in forecast[:3]:  # Check next 3 days
            if pred['predicted_consumption'] > avg_consumption * 1.2:
                alerts.append({
                    'id': f"PEAK_DEMAND_{pred['date']}",
                    'severity': 'medium',
                    'message': f"Peak demand expected on {pred['date']}: {pred['predicted_consumption']:.0f} MLD",
                    'zone': None,
                    'recommendation': 'Pre-position mobile water tankers and increase pumping capacity.',
                    'created_at': datetime.now().isoformat()
                })
                break
        
        # Check zone imbalances
        latest_zone_data = self.historical_df.tail(len(self.zones))
        for _, zone_row in latest_zone_data.iterrows():
            zone = next((z for z in self.zones if z['id'] == zone_row['zone_id']), None)
            if zone:
                expected = zone['base_demand']
                actual = zone_row['consumption']
                if actual > expected * 1.3:
                    alerts.append({
                        'id': f"ZONE_HIGH_{zone['id']}",
                        'severity': 'medium',
                        'message': f"High demand in {zone['name']}: {actual:.0f} MLD vs expected {expected:.0f} MLD",
                        'zone': zone['id'],
                        'recommendation': f"Increase supply to {zone['name']} zone.",
                        'created_at': datetime.now().isoformat()
                    })
        
        # Festival alert
        if today['is_festival']:
            alerts.append({
                'id': 'FESTIVAL_001',
                'severity': 'low',
                'message': f"Festival period active. Demand typically 20-25% higher.",
                'zone': None,
                'recommendation': 'Maintain elevated supply levels throughout festival period.',
                'created_at': datetime.now().isoformat()
            })
        
        # Low rainfall alert during summer
        if today['month'] in [3, 4, 5, 6] and today['precipitation'] < 1:
            avg_precip = self.city_df[self.city_df['month'].isin([3, 4, 5, 6])]['precipitation'].mean()
            if avg_precip < 5:
                alerts.append({
                    'id': 'DROUGHT_RISK_001',
                    'severity': 'high',
                    'message': 'Extended dry period during summer. Monitor reservoir levels.',
                    'zone': None,
                    'recommendation': 'Implement water conservation measures and public awareness campaigns.',
                    'created_at': datetime.now().isoformat()
                })
        
        # Add general optimization suggestion
        alerts.append({
            'id': 'OPTIMIZE_001',
            'severity': 'low',
            'message': 'Daily optimization recommendation available.',
            'zone': None,
            'recommendation': f"Optimize distribution based on current demand: {today['consumption']:.0f} MLD",
            'created_at': datetime.now().isoformat()
        })
        
        return alerts
    
    def get_zones_data(self) -> List[Dict]:
        """Get current data for all zones"""
        self.ensure_initialized()
        
        zone_data = []
        latest_data = self.historical_df.groupby('zone_id').last().reset_index()
        
        for zone in self.zones:
            zone_latest = latest_data[latest_data['zone_id'] == zone['id']]
            if len(zone_latest) > 0:
                row = zone_latest.iloc[0]
                zone_data.append({
                    'zone_id': zone['id'],
                    'zone_name': zone['name'],
                    'population': zone['population'],
                    'industrial_units': int(zone['industrial_ratio'] * 100),
                    'current_demand': round(row['consumption'], 2),
                    'current_supply': round(row['consumption'] * 1.1, 2),  # 10% buffer
                    'status': 'normal' if row['consumption'] < zone['base_demand'] * 1.2 else 'high'
                })
        
        return zone_data
    
    def get_model_stats(self) -> Dict:
        """Get model training statistics"""
        self.ensure_initialized()
        return self.forecaster.training_stats


# Singleton instance
_service_instance: Optional[PredictionService] = None

def get_prediction_service() -> PredictionService:
    """Get or create prediction service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = PredictionService()
    return _service_instance
