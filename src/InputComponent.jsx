import React from 'react';

const InputComponent = ({ onAnalyze }) => {
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => onAnalyze(null, e.target.result);
        reader.readAsText(file);
    };

    return (
        <div>
            <input type="file" accept=".html" onChange={handleFileUpload} />
        </div>
    );
};

export default InputComponent;
