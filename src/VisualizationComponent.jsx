import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = {
    critical: '#FF6347', // Red for critical issues
    serious: '#FFA500', // Orange for moderate issues
    moderate: '#a5a506', // Yellow for moderate issues
    minor: '#90EE90', // Green for minor issues
};

const VisualizationComponent = ({ data }) => {
    // Prepare data for the bar chart
    const chartData = data.map((issue) => ({
        name: issue.id,
        count: issue.nodes.length,
        severity: issue.severity,
    }));

    // Aggregate data for the pie chart based on severity
    const severityCounts = chartData.reduce((acc, curr) => {
        acc[curr.severity] = (acc[curr.severity] || 0) + curr.count;
        return acc;
    }, {});

    const pieChartData = Object.entries(severityCounts).map(([key, value]) => ({
        name: key,
        count: value,
    }));

    return (
        <div className='main-wrapper'>
            <h2>Accessibility Issues Dashboard</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                {/* Bar Chart */}
                <div>
                    <h3>Issue Counts by Type</h3>
                    <BarChart width={600} height={300} data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                </div>

                {/* Pie Chart */}
                <div>
                    <h3>Severity Distribution</h3>
                    <PieChart width={300} height={300}>
                        <Pie
                            data={pieChartData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                            {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                            ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                    </PieChart>
                </div>
            </div>

            {/* Table */}
            <h3>Detailed Issue Breakdown</h3>
            <table>
                <thead>
                    <tr>
                        <th>Issue</th>
                        <th>Description</th>
                        <th>Severity</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((issue) => (
                        <tr key={issue.id}>
                            <td>{issue.id}</td>
                            <td>{issue.description}</td>
                            <td style={{ color: COLORS[issue.severity] }}>{issue.severity}</td>
                            <td>{issue.nodes.length}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default VisualizationComponent;
