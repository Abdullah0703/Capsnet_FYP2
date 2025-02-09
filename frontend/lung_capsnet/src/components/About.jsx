import React from 'react'

const About = () => {
    return (
        <>
            <section id="about" className="py-20 px-8 bg-white/5">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8 text-center">About Us</h2>
                    <div className="space-y-6 opacity-90">
                        <p>
                            LungAI is a medical technology initiative developed by a team of AI researchers
                            and healthcare professionals. Our mission is to provide accessible screening tools
                            for early detection of pulmonary abnormalities.
                        </p>
                        <p>
                            While our system demonstrates high accuracy in nodule detection, it is designed
                            to assist - not replace - professional medical judgment. Always consult a
                            qualified healthcare provider for medical diagnosis.
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}

export default About