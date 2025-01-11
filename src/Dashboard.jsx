import React, { useState } from 'react';
import InputComponent from './InputComponent';
import { analyzeWebsite } from './analyzeWebsite';
import VisualizationComponent from './VisualizationComponent';
import RecommendationsComponent from './RecommendationsComponent';

const Dashboard = () => {
    const [results, setResults] = useState([]);
    const [html, setHtml] = useState('');

    const handleAnalyze = async (url, fileHtml = null) => {
        let htmlContent = fileHtml;

        if (url) {
            const response = await fetch(url);
            htmlContent = await response.text();
        }

        setHtml(htmlContent);

        const analysisResults = await analyzeWebsite(htmlContent);
        console.log(analysisResults)
        setResults(analysisResults);
    };

    return (
        <div>
            <h1>Accessibility Dashboard</h1>
            <InputComponent onAnalyze={handleAnalyze} />
            {results.length > 0 && (
                <>
                    <VisualizationComponent data={results} />
                    <RecommendationsComponent data={results} />
                </>
            )}
        </div>
    );
};

export default Dashboard;
