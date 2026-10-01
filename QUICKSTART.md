# 🚀 Quick Start - Smart Healthcare System

## ⚡ Fastest Way to Run the Application

### Prerequisites
- Node.js 20.x
- Python 3.11
- PostgreSQL 16

### 1. Setup (5 minutes)
```bash
# Clone and navigate
cd MP

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npx prisma generate
npx prisma db push
npm run prisma:seed

# Frontend setup
cd ../frontend
npm install

# ML Service setup
cd ../ml-service
pip install -r requirements.txt
python train.py
```

### 2. Run (3 terminals)
```bash
# Terminal 1: ML Service
cd ml-service
python app.py

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### 3. Access
- Open: http://localhost:5173
- Login as Admin: `admin@smarthealth.gov` / `Admin@123`
- Login as Doctor: `dr.sharma@smarthealth.gov` / `Doctor@123`
- Login as Patient: `rahul.verma@example.com` / `Patient@123`

## 🐳 Docker (Even Faster!)

```bash
cd MP
docker-compose up --build
```

Wait 2 minutes, then access http://localhost:5173

---

## ✅ What's Included?

✨ **200+ Demo Records**: Patients, doctors, hospitals, visits, diseases
🤖 **4 Trained ML Models**: Risk (88% accuracy), Anomaly, Hotspot, Forecast
🦠 **Multiple Disease Tracking**: Malaria, Dengue, Typhoid, COVID-19, Cholera, TB, Pneumonia, Viral Hepatitis
🗺️ **Multi-Disease Outbreaks**: 
   - Malaria outbreak in Riverside District (71 cases)
   - Dengue cases in Metro North (12 cases)
   - Typhoid cases in Downtown Central (6 cases)
👨‍⚕️ **Complete Workflows**: Patient registration → Doctor visit → Surveillance → Alerts
🔒 **Security**: JWT auth, RBAC, audit logs, password hashing
📊 **Real-Time Analytics**: Charts, maps, trends, forecasts for ALL diseases

---

## 📱 Test the Complete Flow

1. **Patient Portal** (rahul.verma@example.com)
   - View Smart Health Card with QR
   - Check medical timeline (has Malaria history)
   - See family health tree (cardiovascular pattern detected)
   - View AI risk assessment

2. **Doctor Portal** (dr.sharma@smarthealth.gov)
   - Search patient: SHC-2026-000001
   - View complete medical history
   - Record new visit with vitals
   - See AI risk & anomaly warnings
   - Prescribe medication (allergy checking works!)

3. **Admin Dashboard** (admin@smarthealth.gov)
   - See disease surveillance overview
   - Check hotspot map (Riverside District = HIGH RISK)
   - View disease forecast (Malaria trending up)
   - Read AI-generated insights
   - See active community alerts

---

## 🎯 Key Features to Demonstrate

### Multi-Disease Surveillance System
- **8 Tracked Diseases**: Malaria, Dengue, Typhoid, COVID-19, Cholera, Viral Hepatitis, Tuberculosis, Pneumonia
- **Real Outbreak Data**: 
  - Riverside District: 71 Malaria cases (HIGH RISK)
  - Metro North: 12 Dengue cases (WARNING)
  - Downtown Central: 6 Typhoid cases (NORMAL)
- **Geographic Analysis**: Separate hotspots for each disease
- **Disease-Specific Alerts**: Each disease tracked independently

### Smart Health ID & QR Code
- Every patient gets unique ID: `SHC-2026-XXXXXX`
- QR code for emergency profile access
- Printable/digital health card

### Disease Episode System
- Malaria episode MAL-EP-001 has 3 visits
- System groups related visits automatically
- Each visit preserved (immutable records)

### Family Health Patterns
- Patient Rahul Verma's family has cardiovascular disease pattern
- Father, Brother, Grandfather all affected
- System detects and warns about hereditary risk

### AI/ML Predictions
- **Risk Model**: Enter high BP/glucose → See HIGH risk score
- **Anomaly Detection**: Extreme vitals flagged automatically
- **Hotspot Clustering**: DBSCAN groups nearby cases
- **Forecasting**: Predicts next 4 weeks of cases

### Automatic Surveillance
- New visit for **ANY tracked disease** triggers surveillance
- System analyzes trends for **each disease separately**
- Detects outbreaks for Malaria, Dengue, Typhoid, COVID, etc.
- Generates **disease-specific alerts** for affected areas
- Notifies residents based on **specific disease in their area**
- Recommends health camps for high-risk diseases

### Multi-Disease Tracking Per Area
- **Same area, different diseases**: Each tracked independently
- **Riverside District** example:
  - Malaria: 71 cases → HIGH RISK → Active alert
  - Dengue: 0 cases → NORMAL → No alert
  - Other diseases monitored separately
- **Independent forecasts** for each disease-location combination

---

## 🔧 Troubleshooting

**Port conflicts?**
```bash
# Change ports in .env files
# Backend: PORT=5001
# Frontend: VITE_API_URL=http://localhost:5001/api
```

**Database error?**
```bash
# Reset database
cd backend
npx prisma db push --force-reset
npm run prisma:seed
```

**ML models not found?**
```bash
cd ml-service
python train.py
# Check models/ folder created
```

---

## 📚 Full Documentation

- **README.md** - Complete project documentation
- **SETUP.md** - Detailed installation guide
- **API.md** - All API endpoints
- **backend/tests/run-tests.ts** - Automated test suite

---

## 🎓 For Your College Presentation

### What to Highlight:
1. **Full-Stack Architecture** - React + Express + Python ML + PostgreSQL
2. **Real ML Models** - Trained models with actual accuracy metrics
3. **Production-Grade** - Docker, security, testing, documentation
4. **Healthcare Domain** - Disease surveillance, medical records, QR cards
5. **Automation** - Alerts auto-generate from surveillance data

### Live Demo Flow:
1. Show admin dashboard with real outbreak statistics
2. Doctor records visit → triggers surveillance → alert generated
3. Show ML predictions with explanations
4. Display interactive disease map with hotspots
5. Show family health pattern detection
6. Print Smart Health Card with QR code

---

## 🎉 You're Ready!

The system is fully functional with:
- ✅ Complete authentication (3 roles)
- ✅ 22 frontend pages (Patient/Doctor/Admin)
- ✅ 14 backend controllers
- ✅ 4 trained ML models
- ✅ Automated surveillance engine
- ✅ Location-based alert system
- ✅ Comprehensive test suite
- ✅ Docker deployment

**Everything works end-to-end!** 🚀


