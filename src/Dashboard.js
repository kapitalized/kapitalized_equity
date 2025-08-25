const Dashboard = ({ selectedCompany, futureScenarioResults, calculateEquity }) => (
  <div>
    <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Dashboard - {selectedCompany.name}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>Share Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={futureScenarioResults || []}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {futureScenarioResults && futureScenarioResults.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#1a73e8', '#34a853', '#fbbc05', '#4285f4', '#db4437', '#0f9d58'][index % 6]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
    <button onClick={calculateEquity} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 mb-4">
      <BarChart3 className="h-4 w-4 inline mr-1" /> Recalculate Equity
    </button>
  </div>
);

export default Dashboard;
