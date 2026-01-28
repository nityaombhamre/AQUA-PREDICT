"""
ML Forecasting Model for Water Demand Prediction
Uses Gradient Boosting with feature engineering for accurate predictions
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from datetime import datetime, timedelta, date
from typing import List, Dict, Tuple, Optional
import pickle
import os


class WaterDemandForecaster:
    """ML-based water demand forecasting model"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'temperature', 'humidity', 'precipitation',
            'day_of_week', 'month', 'day_of_year',
            'is_weekend', 'is_festival', 'population_index',
            'is_heatwave', 'temp_lag_1', 'temp_lag_7',
            'consumption_lag_1', 'consumption_lag_7',
            'consumption_rolling_7', 'consumption_rolling_30'
        ]
        self.is_trained = False
        self.training_stats = {}
        
    def _add_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add lagged features for time series prediction"""
        df = df.copy()
        df = df.sort_values('date')
        
        # Temperature lags
        df['temp_lag_1'] = df['temperature'].shift(1)
        df['temp_lag_7'] = df['temperature'].shift(7)
        
        # Consumption lags
        df['consumption_lag_1'] = df['consumption'].shift(1)
        df['consumption_lag_7'] = df['consumption'].shift(7)
        
        # Rolling averages
        df['consumption_rolling_7'] = df['consumption'].rolling(window=7, min_periods=1).mean()
        df['consumption_rolling_30'] = df['consumption'].rolling(window=30, min_periods=1).mean()
        
        # Fill NaN values with forward/backward fill
        df = df.bfill().ffill()
        
        return df
    
    def _prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare feature matrix and target vector"""
        df = self._add_lag_features(df)
        
        # Convert boolean columns to int
        df['is_weekend'] = df['is_weekend'].astype(int)
        df['is_festival'] = df['is_festival'].astype(int)
        df['is_heatwave'] = df['is_heatwave'].astype(int)
        
        X = df[self.feature_columns].values
        y = df['consumption'].values
        
        return X, y
    
    def train(self, df: pd.DataFrame, test_size: float = 0.2) -> Dict:
        """Train the forecasting model"""
        print("Preparing features...")
        X, y = self._prepare_features(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, shuffle=False  # Time series - no shuffle
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Gradient Boosting model
        print("Training Gradient Boosting model...")
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            min_samples_split=10,
            min_samples_leaf=5,
            subsample=0.8,
            random_state=42
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        # Predictions for error metrics
        y_pred = self.model.predict(X_test_scaled)
        mae = np.mean(np.abs(y_test - y_pred))
        rmse = np.sqrt(np.mean((y_test - y_pred) ** 2))
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
        
        self.training_stats = {
            'train_r2': round(train_score, 4),
            'test_r2': round(test_score, 4),
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'mape': round(mape, 2),
            'n_samples': len(df),
            'trained_at': datetime.now().isoformat()
        }
        
        # Feature importance
        importance = dict(zip(self.feature_columns, self.model.feature_importances_))
        self.training_stats['feature_importance'] = {
            k: round(v, 4) for k, v in sorted(
                importance.items(), key=lambda x: x[1], reverse=True
            )
        }
        
        self.is_trained = True
        print(f"Training complete! Test R²: {test_score:.4f}, MAPE: {mape:.2f}%")
        
        return self.training_stats
    
    def predict(
        self,
        historical_df: pd.DataFrame,
        days_ahead: int = 7,
        weather_forecast: Optional[List[Dict]] = None
    ) -> List[Dict]:
        """Generate predictions for future dates"""
        
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        # Get last known values
        df = historical_df.copy()
        df = self._add_lag_features(df)
        last_row = df.iloc[-1]
        last_date = datetime.fromisoformat(str(last_row['date']))
        
        predictions = []
        
        # Use last known values for lag features initially
        prev_consumption = last_row['consumption']
        consumption_7_ago = df.iloc[-7]['consumption'] if len(df) >= 7 else prev_consumption
        rolling_7 = df['consumption'].tail(7).mean()
        rolling_30 = df['consumption'].tail(30).mean()
        
        for i in range(days_ahead):
            future_date = last_date + timedelta(days=i + 1)
            day_of_year = future_date.timetuple().tm_yday
            
            # Get weather forecast or estimate based on season
            if weather_forecast and i < len(weather_forecast):
                temp = weather_forecast[i].get('temperature', 30)
                humidity = weather_forecast[i].get('humidity', 50)
                precipitation = weather_forecast[i].get('precipitation', 0)
            else:
                # Estimate based on historical patterns
                similar_days = df[df['day_of_year'] == day_of_year]
                if len(similar_days) > 0:
                    temp = similar_days['temperature'].mean()
                    humidity = similar_days['humidity'].mean()
                    precipitation = similar_days['precipitation'].mean()
                else:
                    temp = 30
                    humidity = 50
                    precipitation = 0
            
            # Check for festival (simplified)
            is_festival = 0
            
            # Check for heatwave
            is_heatwave = 1 if temp > 42 else 0
            
            # Population growth projection
            years_ahead = (i + 1) / 365
            population_index = last_row['population_index'] * (1 + 0.015 * years_ahead)
            
            # Prepare feature vector
            features = np.array([[
                temp, humidity, precipitation,
                future_date.weekday(), future_date.month, day_of_year,
                1 if future_date.weekday() >= 5 else 0,  # is_weekend
                is_festival,
                population_index,
                is_heatwave,
                temp,  # temp_lag_1 (estimated)
                temp,  # temp_lag_7 (estimated)
                prev_consumption,
                consumption_7_ago,
                rolling_7,
                rolling_30
            ]])
            
            # Scale and predict
            features_scaled = self.scaler.transform(features)
            predicted = self.model.predict(features_scaled)[0]
            
            # Calculate confidence interval (simplified using training RMSE)
            rmse = self.training_stats.get('rmse', predicted * 0.05)
            uncertainty = rmse * (1 + 0.1 * i)  # Uncertainty grows with forecast horizon
            
            predictions.append({
                'date': future_date.date().isoformat(),
                'predicted_consumption': round(predicted, 2),
                'lower_bound': round(max(0, predicted - 1.96 * uncertainty), 2),
                'upper_bound': round(predicted + 1.96 * uncertainty, 2),
                'confidence': round(max(0.5, 0.95 - 0.02 * i), 2),  # Decreasing confidence
                'factors': {
                    'temperature': round(temp, 1),
                    'humidity': round(humidity, 1),
                    'precipitation': round(precipitation, 1),
                    'is_weekend': future_date.weekday() >= 5,
                    'day_of_week': future_date.strftime('%A'),
                    'population_index': round(population_index, 4)
                }
            })
            
            # Update lag values for next iteration
            consumption_7_ago = prev_consumption
            prev_consumption = predicted
            rolling_7 = (rolling_7 * 6 + predicted) / 7
            rolling_30 = (rolling_30 * 29 + predicted) / 30
        
        return predictions
    
    def get_factor_impact(self, df: pd.DataFrame) -> List[Dict]:
        """Analyze impact of different factors on water demand"""
        
        if not self.is_trained:
            return []
        
        impacts = []
        importance = self.training_stats.get('feature_importance', {})
        
        # Weather impact
        impacts.append({
            'factor_name': 'Temperature',
            'current_value': round(df['temperature'].iloc[-1], 1),
            'impact_percentage': round(importance.get('temperature', 0) * 100, 1),
            'trend': 'increasing' if df['temperature'].diff().tail(7).mean() > 0 else 'decreasing'
        })
        
        impacts.append({
            'factor_name': 'Precipitation',
            'current_value': round(df['precipitation'].iloc[-1], 1),
            'impact_percentage': round(importance.get('precipitation', 0) * 100, 1),
            'trend': 'stable'
        })
        
        # Seasonal patterns
        impacts.append({
            'factor_name': 'Seasonal Pattern',
            'current_value': df['month'].iloc[-1],
            'impact_percentage': round(importance.get('month', 0) * 100, 1),
            'trend': 'stable'
        })
        
        # Population
        impacts.append({
            'factor_name': 'Population Growth',
            'current_value': round(df['population_index'].iloc[-1], 3),
            'impact_percentage': round(importance.get('population_index', 0) * 100, 1),
            'trend': 'increasing'
        })
        
        # Historical consumption patterns
        impacts.append({
            'factor_name': 'Historical Patterns',
            'current_value': round(df['consumption'].tail(7).mean(), 2),
            'impact_percentage': round((importance.get('consumption_lag_1', 0) + 
                                        importance.get('consumption_rolling_7', 0)) * 100, 1),
            'trend': 'stable'
        })
        
        return impacts
    
    def save_model(self, filepath: str):
        """Save trained model to file"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'training_stats': self.training_stats
        }
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load_model(self, filepath: str):
        """Load trained model from file"""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        self.training_stats = model_data['training_stats']
        self.is_trained = True


# For testing
if __name__ == "__main__":
    from data_generator import DataGenerator
    
    # Generate data
    gen = DataGenerator()
    df = gen.generate_historical_data(days=365)
    city_df = gen.generate_city_totals(df)
    
    # Train model
    forecaster = WaterDemandForecaster()
    stats = forecaster.train(city_df)
    print("\nTraining Stats:", stats)
    
    # Make predictions
    predictions = forecaster.predict(city_df, days_ahead=7)
    print("\nPredictions:")
    for p in predictions:
        print(f"  {p['date']}: {p['predicted_consumption']:.2f} MLD")
