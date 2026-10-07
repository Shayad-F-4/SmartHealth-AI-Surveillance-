import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BpPoint {
  date: string;
  systolic: number;
  diastolic: number;
}

export const BpTrendChart: React.FC<{ data: BpPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No blood pressure records found.</div>;
  }

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Systolic BP (mmHg)',
        data: data.map((d) => d.systolic),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: false,
        pointRadius: 5,
      },
      {
        label: 'Diastolic BP (mmHg)',
        data: data.map((d) => d.diastolic),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.3,
        fill: false,
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { min: 50, max: 200, title: { display: true, text: 'Pressure (mmHg)' } },
    },
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export const GlucoseTrendChart: React.FC<{ data: { date: string; glucose: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No fasting glucose records found.</div>;
  }

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Fasting Glucose (mg/dL)',
        data: data.map((d) => d.glucose),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { min: 60, max: 220, title: { display: true, text: 'Blood Glucose (mg/dL)' } },
    },
  };

  return (
    <div style={{ height: '280px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export const GenericLabTrendChart: React.FC<{
  title: string;
  unit: string;
  data: { date: string; value: number; status: string }[];
}> = ({ title, unit, data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No historical measurements available.</div>;
  }

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: `${title} (${unit})`,
        data: data.map((d) => d.value),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointBackgroundColor: data.map((d) => (d.status === 'ABNORMAL' ? '#ef4444' : '#10b981')),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { title: { display: true, text: `${title} (${unit})` } },
    },
  };

  return (
    <div style={{ height: '260px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export const DiseaseDistributionChart: React.FC<{ data: { disease: string; count: number }[] }> = ({ data }) => {
  const colors = ['#0284c7', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];
  const chartData = {
    labels: data.map((d) => d.disease),
    datasets: [
      {
        label: 'Reported Cases',
        data: data.map((d) => d.count),
        backgroundColor: colors.slice(0, data.length),
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Total Case Count' } },
    },
  };

  return (
    <div style={{ height: '280px', width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export const DiseaseForecastChart: React.FC<{
  historical: number[];
  forecast: number[];
  lowerBound?: number[];
  upperBound?: number[];
  diseaseName: string;
}> = ({ historical, forecast, lowerBound, upperBound, diseaseName }) => {
  const histLabels = historical.map((_, i) => `Week -${historical.length - i}`);
  const fcastLabels = forecast.map((_, i) => `Week +${i + 1} (Forecast)`);
  const allLabels = [...histLabels, ...fcastLabels];

  const histSeries = [...historical, ...Array(forecast.length).fill(null)];
  const fcastSeries = [...Array(historical.length - 1).fill(null), historical[historical.length - 1], ...forecast];

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Observed Historical Cases',
        data: histSeries,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.2,
        pointRadius: 4,
      },
      {
        label: 'ML Projected Trajectory',
        data: fcastSeries,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        tension: 0.2,
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Weekly Cases' } },
    },
  };

  return (
    <div style={{ height: '320px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
