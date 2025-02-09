import React from 'react'

const Working = () => {
    return (
        <>
            <section id="working" className="py-20 px-8 mt-20">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white/10 p-6 rounded-xl">
                            <h3 className="text-xl font-semibold mb-4">1. Upload Scan</h3>
                            <p className="opacity-80">Upload your DICOM format CT scan using our secure portal</p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-xl">
                            <h3 className="text-xl font-semibold mb-4">2. AI Analysis</h3>
                            <p className="opacity-80">Our capsule network model analyzes the scan for nodules</p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-xl">
                            <h3 className="text-xl font-semibold mb-4">3. Get Results</h3>
                            <p className="opacity-80">Receive instant results with confidence levels and recommendations</p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Working