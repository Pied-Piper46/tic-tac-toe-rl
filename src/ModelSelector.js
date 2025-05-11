import React from 'react';

const models = [
    { file: 'q_table_easy.json', name: 'Easy Model'},
    { file: 'q_table_normal.json', name: 'Normal Model'},
    { file: 'q_table_advanced.json', name: 'Advanced Model'},
];

function ModelSelector({ currentModelFile, onChangeModel, disabled }) {
    return (
        <div className="model-selector">
            <label htmlFor="model-select"> Select a model: </label>
            <select
                id="model-select"
                value={currentModelFile}
                onChange={(e) => onChangeModel(e.target.value)}
                disabled={disabled}
            >
                {models.map(model => (
                    <option key={model.file} value={model.file}>
                        {model.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default ModelSelector;