import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  HeartPulse,
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Pill,
  TestTube,
  Calendar,
  ChevronRight,
  Shield,
  MapPin,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const PatientDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState<any>(null);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [activeEpisodes, setActiveEpisodes] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labReports, setLabReports] = useState<any[]>([]);
  const [familyData, setFamilyData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [districtAlerts, setDistrictAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [
          riskRes,
          timelineRes,
          episodesRes,
          prescriptionsRes,
          labsRes,
          familyRes,
          analyticsRes,
          alertsRes,
        ] = await Promise.allSettled([
          api.get('/patients/risk'),
          api.get('/patients/timeline'),
          api.get('/patients/episodes'),
          api.get('/prescriptions'),
          api.get('/labs'),
          api.get('/family/tree'),
          api.get('/patients/analytics'),
          api.get('/alerts'),
        ]);

        if (riskRes.status === 'fulfilled') setRiskData(riskRes.value.data.latestRiskAssessment || riskRes.value.data);
        if (timelineRes.status === 'fulfilled') setRecentVisits(timelineRes.value.data.slice(0, 4));
        if (episodesRes.status === 'fulfilled') {
          setActiveEpisodes(episodesRes.value.data.filter((e: any) => e.status === 'ACTIVE'));
        }
        if (prescriptionsRes.status === 'fulfilled') {
          const activePrescriptions = prescriptionsRes.value.data.prescriptions?.filter((p: any) => p.status === 'ACTIVE') || [];
          setPrescriptions(activePrescriptions.slice(0, 4));
        }
        if (labsRes.status === 'fulfilled') {
          setLabReports(labsRes.value.data.labs || labsRes.value.data || []);
        }
        if (familyRes.status === 'fulfilled') setFamilyData(familyRes.value.data);
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
        if (alertsRes.status === 'fulfilled') {
          const userDistrict = user?.patient?.district;
          const filteredAlerts = alertsRes.value.data.filter((alert: any) => 
            alert.isActive && alert.district?.toLowerCase() === userDistrict?.toLowerCase()
          );
          setDistrictAlerts(filteredAlerts);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const bloodGroup = user?.patient?.bloodGroup || 'O+';
  const healthId = user?.patient?.healthId || 'SHC-2026-000001';
  const district = user?.patient?.district || 'Riverside District';
  const patientName = user?.name?.split(' ')[0] || 'Patient';

  // Prepare health trends chart data
  const prepareChartData = () => {
    if (!analytics?.bpSeries || analytics.bpSeries.length === 0) {
      return null;
    }

    const bpData = analytics.bpSeries;
    
    return {
      labels: bpData.map((item: any) => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Systolic BP (mmHg)',
          data: bpData.map((item: any) => item.systolic),
          borderColor: '#1677E8',
          backgroundColor: 'rgba(22, 119, 232, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Diastolic BP (mmHg)',
          data: bpData.map((item: any) => item.diastolic),
          borderColor: '#52C41A',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  // Calculate lab report stats
  const labStats = {
    total: labReports.length,
    normal: labReports.filter((lab: any) => !lab.isOutOfRange).length,
    needsReview: labReports.filter((lab: any) => lab.isOutOfRange).length,
    pending: 0,
  };

  // Get latest vitals from recent visit
  const latestVisit = recentVisits[0];
  const latestVitals = {
    bp: latestVisit ? `${latestVisit.systolicBp || 120}/${latestVisit.diastolicBp || 80}` : '120/80',
    bpStatus: latestVisit && (latestVisit.systolicBp > 130 || latestVisit.diastolicBp > 85) ? 'Needs attention' : 'Within reference range',
    glucose: latestVisit?.glucose || 96,
    glucoseStatus: latestVisit && latestVisit.glucose > 100 ? 'Needs attention' : 'Within reference range',
    bmi: latestVisit?.bmi || 26,
    bmiStatus: latestVisit && latestVisit.bmi > 25 ? 'Needs attention' : 'Within reference range',
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '60vh',
        color: '#64748B'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={40} style={{ marginBottom: '1rem', animation: 'pulse 2s ease-in-out infinite' }} />
          <div>Loading your health overview...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto',
      padding: '0',
      background: '#F7FAFD',
    }}>
      {/* ============================================
          1. WELCOME HERO SECTION
          ============================================ */}
      <div style={{ 
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#0F1B3D',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}>
            Welcome back, {patientName}
          </h1>
          <p style={{ 
            color: '#64748B', 
            fontSize: '15px',
            lineHeight: 1.6,
          }}>
            Here's a simple overview of your health records and recent activity.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('timeline')}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'white',
              border: '1px solid #E4EAF2',
              borderRadius: '8px',
              color: '#1677E8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1677E8';
              e.currentTarget.style.background = '#EAF4FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E4EAF2';
              e.currentTarget.style.background = 'white';
            }}
          >
            <FileText size={16} />
            View Medical Timeline
          </button>
          
          <button
            onClick={() => onNavigate('card')}
            style={{
              padding: '0.6rem 1.25rem',
              background: '#1677E8',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0F5FCC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1677E8';
            }}
          >
            <CreditCard size={16} />
            Smart Health Card
          </button>
        </div>
      </div>

      {/* ============================================
          2. COMMUNITY DISEASE ALERT
          ============================================ */}
      {districtAlerts.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #FFE7CC',
          borderLeft: '4px solid #FF9933',
          borderRadius: '10px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
        }}>
          <div style={{ 
            padding: '0.5rem',
            background: '#FFF7ED',
            borderRadius: '8px',
            height: 'fit-content',
          }}>
            <AlertTriangle size={24} color="#FF9933" />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: '#0F1B3D',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              🚨 Health Alert in Your Area
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: '#FFF7ED',
                color: '#D97706',
                padding: '3px 8px',
                borderRadius: '4px',
              }}>
                Community Awareness
              </span>
            </div>
            
            <p style={{ 
              fontSize: '14px', 
              color: '#475569',
              lineHeight: 1.6,
              marginBottom: '1rem',
            }}>
              Reported {districtAlerts[0].disease} cases are increasing in {districtAlerts[0].district}.
              {districtAlerts.length > 1 && ` Additionally, activity detected for ${districtAlerts.length - 1} other disease(s) in your area.`}
            </p>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem',
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '0.25rem' }}>
                  Disease
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F1B3D' }}>
                  {districtAlerts.length === 1 
                    ? districtAlerts[0].disease 
                    : `Multiple (${districtAlerts.length})`
                  }
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '0.25rem' }}>
                  Area
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F1B3D', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} />
                  {district}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '0.25rem' }}>
                  Trend
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <TrendingUp size={14} />
                  Increasing
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('alerts')}
              style={{
                padding: '0.5rem 1rem',
                background: '#1677E8',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              View Area Health Alerts
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          3. HEALTH SUMMARY CARDS (4-column grid)
          ============================================ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        {/* Card 1: Smart Health ID */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#EAF4FF',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CreditCard size={20} color="#1677E8" />
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '0.35rem', fontWeight: 500 }}>
            Smart Health ID
          </div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: '#0F1B3D',
            fontFamily: 'monospace',
            marginBottom: '0.75rem',
          }}>
            {healthId}
          </div>
          
          <button
            onClick={() => onNavigate('card')}
            style={{
              background: 'none',
              border: 'none',
              color: '#1677E8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            View Health Card
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 2: Blood Group */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#FEF2F2',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HeartPulse size={20} color="#DC2626" />
            </div>
            
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              background: '#ECFDF5',
              color: '#059669',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              <CheckCircle size={12} />
              Verified
            </span>
          </div>
          
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '0.35rem', fontWeight: 500 }}>
            Blood Group
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 800, 
            color: '#DC2626',
          }}>
            {bloodGroup}
          </div>
        </div>

        {/* Card 3: Active Episodes */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#F5F3FF',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Activity size={20} color="#7C3AED" />
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '0.35rem', fontWeight: 500 }}>
            Active Health Episodes
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 800, 
            color: '#0F1B3D',
            marginBottom: '0.35rem',
          }}>
            {activeEpisodes.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            {activeEpisodes.length > 0 
              ? activeEpisodes[0].disease 
              : 'All conditions resolved'
            }
          </div>
        </div>

        {/* Card 4: Health Trend */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#ECFDF5',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={20} color="#059669" />
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '0.35rem', fontWeight: 500 }}>
            Health Trend
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: '#059669',
            marginBottom: '0.35rem',
          }}>
            Stable
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Based on recent vitals
          </div>
        </div>
      </div>

      {/* ============================================
          4. PERSONAL HEALTH SNAPSHOT
          ============================================ */}
      <div style={{
        background: 'white',
        border: '1px solid #E4EAF2',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          color: '#0F1B3D',
          marginBottom: '1.25rem',
        }}>
          Your Health Snapshot
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
        }}>
          {/* Blood Pressure */}
          <div style={{
            padding: '1rem',
            background: '#F7FAFD',
            borderRadius: '10px',
            border: '1px solid #E4EAF2',
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '0.5rem', fontWeight: 500 }}>
              Blood Pressure
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F1B3D', marginBottom: '0.35rem' }}>
              {latestVitals.bp}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', marginLeft: '0.35rem' }}>
                mmHg
              </span>
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: latestVitals.bpStatus.includes('attention') ? '#D97706' : '#059669',
            }}>
              {latestVitals.bpStatus}
            </div>
          </div>

          {/* Fasting Glucose */}
          <div style={{
            padding: '1rem',
            background: '#F7FAFD',
            borderRadius: '10px',
            border: '1px solid #E4EAF2',
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '0.5rem', fontWeight: 500 }}>
              Fasting Glucose
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F1B3D', marginBottom: '0.35rem' }}>
              {latestVitals.glucose}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', marginLeft: '0.35rem' }}>
                mg/dL
              </span>
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: latestVitals.glucoseStatus.includes('attention') ? '#D97706' : '#059669',
            }}>
              {latestVitals.glucoseStatus}
            </div>
          </div>

          {/* BMI */}
          <div style={{
            padding: '1rem',
            background: '#F7FAFD',
            borderRadius: '10px',
            border: '1px solid #E4EAF2',
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '0.5rem', fontWeight: 500 }}>
              BMI
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F1B3D', marginBottom: '0.35rem' }}>
              {latestVitals.bmi}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: latestVitals.bmiStatus.includes('attention') ? '#D97706' : '#059669',
            }}>
              {latestVitals.bmiStatus}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '0.85rem',
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#0369A1',
        }}>
          <strong>Note:</strong> These values are from your most recent consultation. Discuss any concerns with your healthcare professional.
        </div>
      </div>

      {/* ============================================
          5. TWO-COLUMN LAYOUT: Recent Activity + AI Risk
          ============================================ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        {/* Recent Medical Activity */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#0F1B3D',
            }}>
              Recent Activity
            </h3>
            
            <button
              onClick={() => onNavigate('timeline')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1677E8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              View Full Timeline
              <ArrowRight size={14} />
            </button>
          </div>

          {recentVisits.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '14px',
            }}>
              No previous medical consultations recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentVisits.map((visit: any, index: number) => (
                <div
                  key={visit.id || index}
                  style={{
                    padding: '1rem',
                    background: '#F7FAFD',
                    border: '1px solid #E4EAF2',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '0.25rem' }}>
                        {new Date(visit.visitDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F1B3D' }}>
                        {visit.disease || visit.diagnosis}
                      </div>
                    </div>
                    
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: visit.severity === 'SEVERE' ? '#FEF2F2' : '#EAF4FF',
                      color: visit.severity === 'SEVERE' ? '#DC2626' : '#1677E8',
                    }}>
                      {visit.severity || 'MODERATE'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '0.35rem' }}>
                    {visit.doctor?.user?.name || 'Doctor consultation'}
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    {visit.hospital?.name || 'Healthcare facility'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Health Risk Assessment */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#0F1B3D',
            }}>
              AI Health Risk Assessment
            </h3>
            
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              background: '#F0F9FF',
              color: '#0369A1',
              padding: '4px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              ML Model
            </span>
          </div>

          {riskData ? (
            <>
              <div style={{
                padding: '1.25rem',
                background: '#F7FAFD',
                borderRadius: '10px',
                marginBottom: '1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Risk Level
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: riskData.riskLevel === 'HIGH' ? '#DC2626' : 
                         riskData.riskLevel === 'MODERATE' ? '#D97706' : '#059669',
                  marginBottom: '0.35rem',
                }}>
                  {riskData.riskLevel || 'LOW'}
                </div>
                <div style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>
                  Score: {riskData.riskScore || '32'}%
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0F1B3D',
                  marginBottom: '0.65rem',
                }}>
                  Contributing Factors:
                </div>
                <ul style={{
                  paddingLeft: '1.25rem',
                  margin: 0,
                }}>
                  {(riskData.contributingFactors || riskData.contributing_factors || ['BMI', 'Family history'])
                    .slice(0, 3)
                    .map((factor: string, idx: number) => (
                    <li key={idx} style={{
                      fontSize: '13px',
                      color: '#475569',
                      marginBottom: '0.35rem',
                      lineHeight: 1.5,
                    }}>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onNavigate('ai-risk')}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  background: '#1677E8',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '0.75rem',
                }}
              >
                View Full Assessment →
              </button>

              <div style={{
                padding: '0.75rem',
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#92400E',
                fontStyle: 'italic',
              }}>
                <strong>Disclaimer:</strong> Decision-support tool — not a medical diagnosis.
              </div>
            </>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
              No risk assessment available
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          6. TWO-COLUMN: Family Health + Current Medicines
          ============================================ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        {/* Family Health Insight */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#0F1B3D',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Users size={20} color="#7C3AED" />
              Family Health Insight
            </h3>
          </div>

          {familyData && familyData.patterns && familyData.patterns.length > 0 ? (
            <>
              <div style={{
                padding: '1rem',
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '14px', color: '#92400E', lineHeight: 1.6 }}>
                  Family health history contains recurring <strong>{familyData.patterns[0].condition}</strong> conditions across multiple relatives.
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '0.85rem',
                background: '#F7FAFD',
                borderRadius: '8px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#F5F3FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#7C3AED',
                }}>
                  {familyData.patterns[0].affectedMembers?.length || 3}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    Relatives affected
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F1B3D' }}>
                    {familyData.patterns[0].condition}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('family')}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  background: 'white',
                  border: '1px solid #E4EAF2',
                  borderRadius: '8px',
                  color: '#1677E8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                View Family Health Tree
                <ArrowRight size={14} />
              </button>

              <div style={{
                marginTop: '0.75rem',
                fontSize: '11px',
                color: '#64748B',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}>
                Discuss preventive screening with your healthcare professional.
              </div>
            </>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '14px',
            }}>
              No family health patterns detected
            </div>
          )}
        </div>

        {/* Current Medicines */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#0F1B3D',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Pill size={20} color="#1677E8" />
              Current Medicines
            </h3>
            
            <button
              onClick={() => onNavigate('prescriptions')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1677E8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              View All
              <ArrowRight size={14} />
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '14px',
            }}>
              No active medications
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {prescriptions.map((rx: any, index: number) => (
                <div
                  key={rx.id || index}
                  style={{
                    padding: '1rem',
                    background: '#F7FAFD',
                    border: '1px solid #E4EAF2',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F1B3D' }}>
                      {rx.medicineName || rx.medicine_name}
                    </div>
                    
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#ECFDF5',
                      color: '#059669',
                    }}>
                      {rx.status || 'Active'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '0.25rem' }}>
                    {rx.dosage} • {rx.frequency}
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Duration: {rx.durationDays || rx.duration_days} days
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          7. TWO-COLUMN: Lab Reports + Health Trend Chart
          ============================================ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        {/* Lab Report Summary */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#0F1B3D',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <TestTube size={20} color="#7C3AED" />
              Recent Lab Reports
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '1rem',
          }}>
            <div style={{
              padding: '1rem',
              background: '#F7FAFD',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F1B3D', marginBottom: '0.25rem' }}>
                {labStats.total}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                Total Reports
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#ECFDF5',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginBottom: '0.25rem' }}>
                {labStats.normal}
              </div>
              <div style={{ fontSize: '12px', color: '#064E3B', fontWeight: 500 }}>
                Normal
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#FFF7ED',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#D97706', marginBottom: '0.25rem' }}>
                {labStats.needsReview}
              </div>
              <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 500 }}>
                Needs Review
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#F7FAFD',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem' }}>
                {labStats.pending}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                Pending
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('labs')}
            style={{
              width: '100%',
              padding: '0.7rem',
              background: 'white',
              border: '1px solid #E4EAF2',
              borderRadius: '8px',
              color: '#1677E8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            View All Reports
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Health Trend Mini Chart */}
        <div style={{
          background: 'white',
          border: '1px solid #E4EAF2',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#0F1B3D',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Activity size={20} color="#1677E8" />
              Health Trends
            </h3>
            
            <button
              onClick={() => onNavigate('trends')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1677E8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              View Details
              <ArrowRight size={14} />
            </button>
          </div>

          {chartData ? (
            <div style={{ height: '200px' }}>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                          size: 12,
                        },
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 27, 61, 0.9)',
                      padding: 12,
                      titleFont: {
                        size: 13,
                      },
                      bodyFont: {
                        size: 12,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                      grid: {
                        color: '#F1F5F9',
                      },
                      ticks: {
                        font: {
                          size: 11,
                        },
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        font: {
                          size: 11,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              fontSize: '14px',
            }}>
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          8. QUICK ACTIONS
          ============================================ */}
      <div style={{
        background: 'white',
        border: '1px solid #E4EAF2',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          color: '#0F1B3D',
          marginBottom: '1.25rem',
        }}>
          Quick Actions
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
        }}>
          <button
            onClick={() => onNavigate('card')}
            style={{
              padding: '1rem',
              background: '#F7FAFD',
              border: '1px solid #E4EAF2',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EAF4FF';
              e.currentTarget.style.borderColor = '#1677E8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F7FAFD';
              e.currentTarget.style.borderColor = '#E4EAF2';
            }}
          >
            <CreditCard size={24} color="#1677E8" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F1B3D' }}>
              Smart Health Card
            </span>
          </button>

          <button
            onClick={() => onNavigate('timeline')}
            style={{
              padding: '1rem',
              background: '#F7FAFD',
              border: '1px solid #E4EAF2',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EAF4FF';
              e.currentTarget.style.borderColor = '#1677E8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F7FAFD';
              e.currentTarget.style.borderColor = '#E4EAF2';
            }}
          >
            <FileText size={24} color="#1677E8" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F1B3D' }}>
              Medical Timeline
            </span>
          </button>

          <button
            onClick={() => onNavigate('labs')}
            style={{
              padding: '1rem',
              background: '#F7FAFD',
              border: '1px solid #E4EAF2',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EAF4FF';
              e.currentTarget.style.borderColor = '#1677E8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F7FAFD';
              e.currentTarget.style.borderColor = '#E4EAF2';
            }}
          >
            <TestTube size={24} color="#1677E8" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F1B3D' }}>
              Lab Reports
            </span>
          </button>

          <button
            onClick={() => onNavigate('prescriptions')}
            style={{
              padding: '1rem',
              background: '#F7FAFD',
              border: '1px solid #E4EAF2',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EAF4FF';
              e.currentTarget.style.borderColor = '#1677E8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F7FAFD';
              e.currentTarget.style.borderColor = '#E4EAF2';
            }}
          >
            <Pill size={24} color="#1677E8" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F1B3D' }}>
              Prescriptions
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
