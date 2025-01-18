import React, { useState } from 'react';

// Helper function to collapse/expand long code blocks
const CodeBlock = ({ code, maxLength = 200 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div>
      <pre className="code-block">
        {isExpanded ? code : code.slice(0, maxLength)}
      </pre>
      {code.length > maxLength && (
        <button onClick={toggleExpand} className="toggle-btn">
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
};

const RecommendationsComponent = ({ data }) => {
    const generateDownloadContent = () => {
        const violationsText = data.map(violation => {
          return `ID: ${violation.id}\nDescription: ${violation.description}\nSeverity: ${violation.severity}\nNodes:\n${violation.nodes.map(node => `  - Line: ${node.line || 'N/A'}\n    ${node.description || ''}\n    ${node.element}`).join("\n")}\n`;
        }).join("\n\n");
    
        return violationsText;
      };
    
     // Function to trigger the download
     const handleDownload = () => {
        const content = generateDownloadContent();
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'violations_report.txt'; // File name
        link.click();
      };
      
  return (
    <div className="recommendations-container">
      <h2>Accessibility Recommendations</h2>
      {data.length === 0 ? (
        <p>No accessibility issues found. Great job!</p>
      ) : (
        <>
        <button onClick={handleDownload} className="download-btn">
            Download Violations Report
        </button>
        {data.map((violation, index) => (
          <div key={index} className="violation">
            <h3>{violation.description}</h3>
            <p><strong>Severity:</strong> {violation.severity}</p>
            {violation.nodes.length > 0 ? (
              <ul>
                {violation.nodes.map((node, nodeIndex) => (
                  <li key={nodeIndex} className="violation-item">
                    <div className="violation-details">
                      <div>
                        <strong>Line Number:</strong> {node.line || 'N/A'}
                      </div>
                      <div>
                        <strong>HTML Snippet:</strong>
                        <CodeBlock code={node.element} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No affected elements found.</p>
            )}
          </div>
        ))}
        </>
      )}
    </div>
  );
};

export default RecommendationsComponent;
