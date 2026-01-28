# 💧 Water Demand Forecaster

**AI-Powered Urban Water Consumption Prediction System**

An intelligent system to forecast short- and medium-term urban water demand by analyzing seasonal trends, weather conditions, population growth, festivals, and industrial usage.

---

## 🌟 Features

- **🤖 ML Forecasting** - Gradient Boosting model with 94%+ accuracy
- **📊 Interactive Dashboard** - Real-time monitoring with Chart.js visualizations
- **🗓️ Seasonal Analysis** - Summer, monsoon, and winter pattern detection
- **🎉 Festival Impact** - Indian festivals (Diwali, Holi, Eid, etc.) modeled
- **🏭 Industrial Tracking** - Zone-wise industrial usage patterns
- **📍 6 Distribution Zones** - Real-time demand/supply monitoring
- **⚠️ Alert System** - Shortage warnings & optimization recommendations
- **📈 Trend Analytics** - Weekly, monthly, and correlation analysis

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python, FastAPI, Uvicorn |
| ML | scikit-learn (Gradient Boosting), pandas, NumPy |
| Frontend | HTML5, CSS3, JavaScript |
| Charts | Chart.js |
| Design | Dark theme with glassmorphism |

---

## 📁 Project Structure

```
water-demand-forecaster/
├── backend/
│   ├── main.py                    # FastAPI server
│   ├── requirements.txt           # Python dependencies
│   ├── models/
│   │   ├── data_models.py         # Pydantic schemas
│   │   └── forecaster.py          # ML prediction model
│   └── services/
│       ├── data_generator.py      # Synthetic data generator
│       └── predictor.py           # Prediction service
├── frontend/
│   ├── index.html                 # Dashboard UI
│   ├── css/
│   │   └── styles.css             # Dark theme styling
│   └── js/
│       ├── api.js                 # Backend API client
│       ├── charts.js              # Chart configurations
│       └── app.js                 # Main application logic
└── README.md
```

---

## 🚀 How to Run

### Prerequisites
- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Edge)

### Step 1: Install Dependencies

```bash
cd water-demand-forecaster/backend
pip install -r requirements.txt
```

Or install directly:
```bash
pip install fastapi uvicorn pandas numpy scikit-learn pydantic
```

### Step 2: Start the Backend Server

```bash
cd water-demand-forecaster/backend
python main.py
```

The server will:
1. Generate 2 years of synthetic training data
2. Train the ML forecasting model
3. Start the API server at **http://localhost:8000**

### Step 3: Open the Dashboard

Simply open the frontend in your browser:

**Windows:**
```bash
start frontend/index.html
```

**Or manually open:**
```
water-demand-forecaster/frontend/index.html
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/stats` | GET | Dashboard summary statistics |
| `/api/historical?days=30` | GET | Historical consumption data |
| `/api/forecast?days=7` | GET | ML predictions with confidence |
| `/api/factors` | GET | Factor impact analysis |
| `/api/alerts` | GET | Active alerts & recommendations |
| `/api/zones` | GET | Zone-wise demand/supply |
| `/api/model/stats` | GET | ML model metrics |

📖 **API Documentation:** http://localhost:8000/docs

---

## 📊 Dashboard Sections

1. **Dashboard** - Overview with stats, charts, and forecast preview
2. **Forecast** - Extended predictions with confidence intervals
3. **Zones** - Distribution zone status and utilization
4. **Analytics** - Monthly/weekly patterns, temperature correlation
5. **Alerts** - Shortage warnings and optimization tips

---

## 🧠 ML Model Details

- **Algorithm:** Gradient Boosting Regressor
- **Features (16):**
  - Temperature, humidity, precipitation
  - Day of week, month, day of year
  - Weekend flag, festival flag
  - Population growth index
  - Heatwave indicator
  - Lagged consumption (1-day, 7-day)
  - Rolling averages (7-day, 30-day)
- **Training Data:** 730 days synthetic data
- **Performance:** R² > 0.94, MAPE < 6%

---

## 🎨 Screenshots

The dashboard features:
- Modern dark theme with blue/cyan accents
- Glassmorphism card effects
- Smooth animations and micro-interactions
- Responsive design for all screen sizes

---

## 📝 License

This project was created for hackathon purposes.

---

## 🤝 Contributing

Feel free to fork and enhance the project!

---

**Built with ❤️ for urban water management**
