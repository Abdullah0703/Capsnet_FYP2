import React, { useState } from 'react';
import axios from 'axios';

const Home = () => {
    const [file, setFile] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://127.0.0.1:8000/predict', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPrediction(response.data);
        } catch (error) {
            console.error('Prediction error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="home" className="px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-12 mt-8">
                    🫁 Lung Nodule Classification System
                </h1>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <label className="block text-lg font-medium">
                                Upload DICOM Scan
                            </label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center px-8 py-6 bg-white/5 border-2 border-dashed border-blue-400 rounded-xl cursor-pointer hover:bg-white/10 transition-all duration-300 w-full">
                                    <svg
                                        className="w-12 h-12 text-blue-400 mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    <span className="text-blue-400 font-medium">
                                        {file ? file.name : 'Select .dcm file'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".dcm"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                'Start Analysis'
                            )}
                        </button>
                    </form>

                    {prediction && (
                        <div className="mt-12 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl animate-fade-in">
                            <h2 className="text-3xl font-bold mb-4 flex items-center">
                                {prediction.class_label === 'Malignant' ? '⚠️' : '✅'}
                                <span className="ml-3">{prediction.class_label} Detection</span>
                            </h2>
                            <div className="space-y-2">
                                <p className="text-xl">
                                    Confidence Level:{" "}
                                    <span className="font-bold">
                                        {(prediction.confidence * 100).toFixed(2)}%
                                    </span>
                                </p>
                                <p className="text-sm opacity-80">
                                    {prediction.class_label === 'Malignant'
                                        ? "Clinical follow-up recommended. This result requires medical validation."
                                        : "Regular screening advised. This result requires medical validation."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Home;
