import React, { useState, useMemo } from 'react';
import { mockInspections } from './mockData';

// Mock API fetch function - to be replaced with actual API call
const fetchInspections = async () => {
  // In a real app, you would fetch this data from an API
  // For now, we're using mock data after a short delay
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockInspections);
    }, 500);
  });
};

const HealthSafetyAnalyticsDashboard = () => {
  const [inspections, setInspections] = useState([]);
  const [selectedSite, setSelectedSite] = useState('All');
  const [loading, setLoading] = useState(true);

  // In a real app, you would use useEffect to fetch data on component mount
  React.useEffect(() => {
    fetchInspections().then(data => {
      setInspections(data);
      setLoading(false);
    });
  }, []);

  const siteCodes = useMemo(() => ['All', ...new Set(inspections.map(i => i.siteCode))], [inspections]);

  const filteredInspections = useMemo(() => {
    if (selectedSite === 'All') {
      return inspections;
    }
    return inspections.filter(i => i.siteCode === selectedSite);
  }, [inspections, selectedSite]);

  const inspectionVolume = useMemo(() => {
    return filteredInspections.reduce((acc, inspection) => {
      acc[inspection.inspectionType] = (acc[inspection.inspectionType] || 0) + 1;
      return acc;
    }, {});
  }, [filteredInspections]);

  const compliancePercentage = useMemo(() => {
    if (filteredInspections.length === 0) {
      return 0;
    }
    const compliantInspections = filteredInspections.filter(i => i.errors === 0).length;
    return (compliantInspections / filteredInspections.length) * 100;
  }, [filteredInspections]);

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Health & Safety Analytics</h1>
          <div className="w-64">
            <label htmlFor="site-code-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Site Code
            </label>
            <select
              id="site-code-filter"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              {siteCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Compliance Percentage Card */}
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">Overall Compliance</h2>
            <p className="text-5xl font-bold text-green-500">{compliancePercentage.toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-2">Based on {filteredInspections.length} inspections</p>
          </div>

          {/* Inspection Volume Card */}
          <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-600 mb-4">Inspection Volume by Type</h2>
            <div className="space-y-4">
              {Object.keys(inspectionVolume).length > 0 ? (
                Object.entries(inspectionVolume).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <p className="text-gray-700">{type}</p>
                    <p className="font-bold text-gray-800">{count}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No inspections found for this site.</p>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
              Total Inspections: {filteredInspections.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthSafetyAnalyticsDashboard;
