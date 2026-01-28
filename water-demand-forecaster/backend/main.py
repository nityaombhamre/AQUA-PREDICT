"""
Water Demand Forecaster - FastAPI Backend Server
Urban Water Consumption Prediction System
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
import uvicorn
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.predictor import get_prediction_service, PredictionService


# Initialize FastAPI app
app = FastAPI(
    title="Water Demand Forecaster API",
    description="AI-based Urban Water Consumption Prediction System",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize prediction service on startup
prediction_service: PredictionService = None


@app.on_event("startup")
async def startup_event():
    """Initialize the prediction service on server startup"""
    global prediction_service
    print("=" * 50)
    print("Water Demand Forecaster - Starting up...")
    print("=" * 50)
    prediction_service = get_prediction_service()
    prediction_service.initialize()
    print("=" * 50)
    print("Server ready! API documentation at http://localhost:8000/docs")
    print("=" * 50)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "status": "online",
        "service": "Water Demand Forecaster API",
        "version": "1.0.0"
    }


@app.get("/api/stats")
async def get_dashboard_stats():
    """
    Get summary statistics for the dashboard
    Returns current consumption, averages, trends, and alert counts
    """
    try:
        stats = prediction_service.get_dashboard_stats()
        return JSONResponse(content=stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/historical")
async def get_historical_data(
    days: int = Query(default=30, ge=1, le=365, description="Number of days of history"),
    zone: Optional[str] = Query(default=None, description="Zone ID filter")
):
    """
    Get historical water consumption data
    - **days**: Number of days of historical data (1-365)
    - **zone**: Optional zone ID to filter by specific zone
    """
    try:
        data = prediction_service.get_historical_data(days=days, zone=zone)
        return JSONResponse(content={"data": data, "count": len(data)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/forecast")
async def get_forecast(
    days: int = Query(default=7, ge=1, le=90, description="Days to forecast"),
    zone: Optional[str] = Query(default=None, description="Zone ID filter")
):
    """
    Get water demand forecast for upcoming days
    - **days**: Number of days to forecast (1-90)
    - **zone**: Optional zone ID for zone-specific forecast
    """
    try:
        predictions = prediction_service.get_forecast(days=days, zone=zone)
        return JSONResponse(content={
            "predictions": predictions,
            "forecast_days": days,
            "generated_at": prediction_service.city_df.iloc[-1]['date']
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/factors")
async def get_factor_analysis():
    """
    Get analysis of factors affecting water demand
    Returns impact percentages and trends for various factors
    """
    try:
        factors = prediction_service.get_factor_analysis()
        return JSONResponse(content={"factors": factors})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/alerts")
async def get_alerts():
    """
    Get current alerts and recommendations
    Returns shortage warnings, optimization tips, and zone-specific alerts
    """
    try:
        alerts = prediction_service.get_alerts()
        return JSONResponse(content={
            "alerts": alerts,
            "total": len(alerts),
            "critical": len([a for a in alerts if a['severity'] == 'critical']),
            "high": len([a for a in alerts if a['severity'] == 'high'])
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/zones")
async def get_zones():
    """
    Get current status of all distribution zones
    Returns demand, supply, and status for each zone
    """
    try:
        zones = prediction_service.get_zones_data()
        return JSONResponse(content={"zones": zones})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/model/stats")
async def get_model_stats():
    """
    Get ML model training statistics
    Returns accuracy metrics, feature importance, and training info
    """
    try:
        stats = prediction_service.get_model_stats()
        return JSONResponse(content=stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trends")
async def get_consumption_trends(
    period: str = Query(default="weekly", description="Trend period: daily, weekly, monthly")
):
    """
    Get consumption trends aggregated by period
    - **period**: Aggregation period (daily, weekly, monthly)
    """
    try:
        import pandas as pd
        
        df = prediction_service.city_df.copy()
        df['date'] = pd.to_datetime(df['date'])
        
        if period == "weekly":
            df['period'] = df['date'].dt.isocalendar().week
            df['year'] = df['date'].dt.year
            grouped = df.groupby(['year', 'period']).agg({
                'consumption': 'mean',
                'temperature': 'mean'
            }).reset_index()
        elif period == "monthly":
            grouped = df.groupby('month').agg({
                'consumption': 'mean',
                'temperature': 'mean'
            }).reset_index()
        else:  # daily
            grouped = df.tail(30)[['date', 'consumption', 'temperature']]
            grouped['date'] = grouped['date'].astype(str)
        
        return JSONResponse(content={
            "period": period,
            "trends": grouped.to_dict(orient='records')
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
