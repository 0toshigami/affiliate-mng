"use client";

export default function AffiliateDashboard() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Affiliate Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Clicks
          </h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Conversions
          </h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Earnings
          </h3>
          <p className="text-3xl font-bold text-gray-900">$0.00</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Conversion Rate
          </h3>
          <p className="text-3xl font-bold text-gray-900">0%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
        <p className="text-gray-600">No data available yet</p>
      </div>
    </div>
  );
}
