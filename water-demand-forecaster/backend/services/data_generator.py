"""
Synthetic Data Generator for Water Demand Forecaster
Generates realistic water consumption patterns based on multiple factors
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import List, Dict, Tuple
import random
import json


class DataGenerator:
    """Generates synthetic water consumption data with realistic patterns"""
    
    # Indian festivals and their approximate dates (month, day)
    FESTIVALS = {
        'Diwali': (11, 1),  # October/November
        'Holi': (3, 15),    # March
        'Eid': (4, 10),     # Varies
        'Christmas': (12, 25),
        'New Year': (1, 1),
        'Independence Day': (8, 15),
        'Republic Day': (1, 26),
        'Ganesh Chaturthi': (9, 10),
        'Durga Puja': (10, 15),
        'Navratri': (10, 1),
    }
    
    # Zone configurations - Indian city zones
    ZONES = [
        {'id': 'Z1', 'name': 'Central Business District', 'base_demand': 45, 'industrial_ratio': 0.3, 'population': 250000},
        {'id': 'Z2', 'name': 'North Residential', 'base_demand': 55, 'industrial_ratio': 0.1, 'population': 400000},
        {'id': 'Z3', 'name': 'South Residential', 'base_demand': 50, 'industrial_ratio': 0.15, 'population': 350000},
        {'id': 'Z4', 'name': 'East Industrial', 'base_demand': 70, 'industrial_ratio': 0.6, 'population': 180000},
        {'id': 'Z5', 'name': 'West Commercial', 'base_demand': 40, 'industrial_ratio': 0.25, 'population': 200000},
        {'id': 'Z6', 'name': 'Old City', 'base_demand': 35, 'industrial_ratio': 0.05, 'population': 300000},
    ]
    
    def __init__(self, seed: int = 42):
        """Initialize with random seed for reproducibility"""
        np.random.seed(seed)
        random.seed(seed)
        self.base_date = datetime(2023, 1, 1)
        
    def _get_temperature(self, day_of_year: int) -> float:
        """Generate realistic temperature for Indian climate"""
        # Base temperature varies by season
        # Summer: March-June (hot), Monsoon: July-Sept (moderate), Winter: Oct-Feb (cool)
        if 60 <= day_of_year < 180:  # March to June - Summer
            base_temp = 35 + 10 * np.sin(np.pi * (day_of_year - 60) / 120)
        elif 180 <= day_of_year < 270:  # July to Sept - Monsoon
            base_temp = 28 + 5 * np.sin(np.pi * (day_of_year - 180) / 90)
        else:  # Winter
            if day_of_year < 60:
                base_temp = 15 + 10 * (day_of_year / 60)
            else:
                base_temp = 25 - 10 * ((day_of_year - 270) / 95)
        
        # Add daily variation
        daily_variation = np.random.normal(0, 3)
        return max(10, min(48, base_temp + daily_variation))
    
    def _get_precipitation(self, day_of_year: int) -> float:
        """Generate precipitation based on monsoon patterns"""
        # Monsoon season: June to September
        if 150 <= day_of_year < 270:
            # Higher chance of rain during monsoon
            if np.random.random() < 0.4:
                return np.random.exponential(15)
            return 0
        else:
            # Occasional rain otherwise
            if np.random.random() < 0.05:
                return np.random.exponential(5)
            return 0
    
    def _is_festival(self, current_date: date) -> Tuple[bool, str]:
        """Check if date is near a festival (±3 days)"""
        for festival, (month, day) in self.FESTIVALS.items():
            festival_date = date(current_date.year, month, day)
            delta = abs((current_date - festival_date).days)
            if delta <= 3:
                return True, festival
        return False, ""
    
    def _calculate_demand(
        self,
        base_demand: float,
        temperature: float,
        precipitation: float,
        is_weekend: bool,
        is_festival: bool,
        industrial_ratio: float,
        day_of_year: int,
        population_growth: float
    ) -> float:
        """Calculate water demand based on various factors"""
        
        demand = base_demand
        
        # Temperature effect - higher temp = more water usage
        if temperature > 35:
            temp_factor = 1 + 0.03 * (temperature - 35)  # +3% per degree above 35
        elif temperature < 20:
            temp_factor = 1 - 0.01 * (20 - temperature)  # -1% per degree below 20
        else:
            temp_factor = 1
        demand *= temp_factor
        
        # Precipitation effect - rain reduces outdoor usage
        if precipitation > 0:
            precip_factor = max(0.85, 1 - 0.01 * precipitation)
            demand *= precip_factor
        
        # Weekend effect - residential areas use more, industrial uses less
        if is_weekend:
            residential_effect = 1.1
            industrial_effect = 0.6
            demand = demand * (1 - industrial_ratio) * residential_effect + \
                     demand * industrial_ratio * industrial_effect
        
        # Festival effect - increased usage
        if is_festival:
            demand *= 1.25
        
        # Seasonal industrial pattern
        # Summer months have higher industrial demand
        if 90 <= day_of_year < 180:
            demand *= (1 + 0.1 * industrial_ratio)
        
        # Population growth effect
        demand *= population_growth
        
        # Add random noise
        noise = np.random.normal(1, 0.05)
        demand *= noise
        
        return max(0, demand)
    
    def generate_historical_data(
        self,
        days: int = 730,  # 2 years of data
        start_date: datetime = None
    ) -> pd.DataFrame:
        """Generate historical water consumption data"""
        
        if start_date is None:
            start_date = self.base_date
            
        records = []
        
        for day_offset in range(days):
            current_datetime = start_date + timedelta(days=day_offset)
            current_date = current_datetime.date()
            day_of_year = current_datetime.timetuple().tm_yday
            
            # Calculate environmental factors
            temperature = self._get_temperature(day_of_year)
            precipitation = self._get_precipitation(day_of_year)
            humidity = 40 + precipitation * 2 + np.random.normal(0, 10)
            humidity = max(20, min(100, humidity))
            
            is_weekend = current_datetime.weekday() >= 5
            is_festival, festival_name = self._is_festival(current_date)
            
            # Population growth (1.5% per year)
            years_from_start = day_offset / 365
            population_growth = 1 + 0.015 * years_from_start
            
            # Generate data for each zone
            for zone in self.ZONES:
                demand = self._calculate_demand(
                    base_demand=zone['base_demand'],
                    temperature=temperature,
                    precipitation=precipitation,
                    is_weekend=is_weekend,
                    is_festival=is_festival,
                    industrial_ratio=zone['industrial_ratio'],
                    day_of_year=day_of_year,
                    population_growth=population_growth
                )
                
                industrial_usage = demand * zone['industrial_ratio']
                
                records.append({
                    'date': current_date.isoformat(),
                    'zone_id': zone['id'],
                    'zone_name': zone['name'],
                    'consumption': round(demand, 2),
                    'temperature': round(temperature, 1),
                    'humidity': round(humidity, 1),
                    'precipitation': round(precipitation, 1),
                    'is_weekend': is_weekend,
                    'is_festival': is_festival,
                    'festival_name': festival_name if is_festival else None,
                    'day_of_week': current_datetime.weekday(),
                    'month': current_datetime.month,
                    'day_of_year': day_of_year,
                    'population_index': round(population_growth, 4),
                    'industrial_usage': round(industrial_usage, 2),
                    'is_heatwave': temperature > 42
                })
        
        return pd.DataFrame(records)
    
    def generate_city_totals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Aggregate zone data to city totals"""
        city_df = df.groupby('date').agg({
            'consumption': 'sum',
            'temperature': 'mean',
            'humidity': 'mean',
            'precipitation': 'mean',
            'is_weekend': 'first',
            'is_festival': 'first',
            'festival_name': 'first',
            'day_of_week': 'first',
            'month': 'first',
            'day_of_year': 'first',
            'population_index': 'mean',
            'industrial_usage': 'sum',
            'is_heatwave': 'first'
        }).reset_index()
        
        return city_df
    
    def get_zones(self) -> List[Dict]:
        """Return zone configurations"""
        return self.ZONES.copy()
    
    def save_to_json(self, df: pd.DataFrame, filepath: str):
        """Save dataframe to JSON file"""
        df.to_json(filepath, orient='records', date_format='iso', indent=2)
        
    def generate_and_save(self, filepath: str, days: int = 730) -> pd.DataFrame:
        """Generate data and save to file"""
        df = self.generate_historical_data(days=days)
        self.save_to_json(df, filepath)
        return df


# For quick testing
if __name__ == "__main__":
    generator = DataGenerator()
    df = generator.generate_historical_data(days=365)
    city_df = generator.generate_city_totals(df)
    print(f"Generated {len(df)} records")
    print(f"City totals: {len(city_df)} days")
    print(df.head())
