"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"
import Link from "next/link";
import "./Home.scss";

const Home = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [guestSessionKey, setGuestSessionKey] = useState(null);
    const router = useRouter();

    useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (["CLIENT", "FREELANCER"].includes(user.role)) {
                setCurrentUser(user);
            }
        } catch (error) {
            console.error("Failed to parse user data from localStorage:", error);
        }
    }

    const existingSession = localStorage.getItem("guestSessionKey");
    if (existingSession) {
        setGuestSessionKey(existingSession);
        return;
    }

    const createGuestSession = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/users/csrf-and-session/", {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const key = data.sessionId || data.session_key || data.sessionid;

            if (key) {
                localStorage.setItem("guestSessionKey", key);
                setGuestSessionKey(key);
            } else {
                console.error("No session key returned:", data);
            }
        } catch (err) {
            console.error("Failed to create guest session key:", err);
        }
    };
    
    createGuestSession();

    }, []);

    const getDashboardPath = (role) => {
        switch (role) {
            case "CLIENT":
                return "/dashboard";
            case "FREELANCER":
                return "/dashboard";
            // case "ADMIN":
            //     return "/admin/dashboard";
            default:
                return "/";
        }
    };

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-content"> 
                    <span className="badge">Premium Academic Excellence</span>
                    <h1 className="brand">
                        The Marketplace for <span className="highlight">Confident</span> Academic Results.
                    </h1>
                    <p className="tagline">
                        Premium academic services with 0% AI, No Plagiarism, and Excellent Language Use.
                    </p>
                    <p className="description">
                        Connect instantly with our exclusive network of vetted experts – no signup required, just pure academic excellence delivered on demand.
                    </p>
                    <div className="cta-buttons">
                        {currentUser ? (
                            <Link href={getDashboardPath(currentUser.role) || "/dashboard"} className="btn primary">
                                Go to Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={guestSessionKey ? `/categories?session_key=${String(guestSessionKey)}` : "/categories"}
                                    className="btn primary"
                                >
                                    Browse Categories →
                                </Link>
                                <Link href="/login" className="btn secondary">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="value-strip">
                <div className="value-item">
                    <span className="value-icon">⭐</span>
                    <p className="value-text">4.9/5.0 Average Expert Rating</p>
                </div>
                <div className="value-item">
                    <span className="value-icon">⚡</span>
                    <p className="value-text">Instant Expert Matching</p>
                </div>
                <div className="value-item">
                    <span className="value-icon">🔒</span>
                    <p className="value-text">100% Confidentiality</p>
                </div>
            </section>

            <section className="features">
                <h2 className="section-title">The Foundation of Trust</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <span className="icon">📝</span>
                        <h3>Zero AI Policy</h3>
                        <p>Every piece is human-written and verified for originality, ensuring your academic integrity is preserved.</p>
                    </div>
                    <div className="feature-card">
                        <span className="icon">🎓</span>
                        <h3>Vetted Specialists</h3>
                        <p>Connect only with degree-holding professionals rigorously selected for subject mastery and reliable expertise.</p>
                    </div>
                    <div className="feature-card">
                        <span className="icon">💬</span>
                        <h3>Direct Communication</h3>
                        <p>Chat directly with your assigned expert 24/7 to monitor progress and guarantee precise results.</p>
                    </div>
                    <div className="feature-card">
                        <span className="icon">✅</span>
                        <h3>Quality Guarantee</h3>
                        <p>We stand by the quality of every service delivered.</p>
                    </div>
                </div>
            </section>
            
            <section className="client-testimonials">
                <h2 className="section-title">Trusted by Students Globally</h2>
                <div className="testimonial-grid">
                    <div className="testimonial-card">
                        <p className="quote">“The results were impeccable, truly human-written and perfectly cited. A massive boost to my final grade!”</p>
                        <p className="author">— Alex P., Master's Student</p>
                    </div>
                    <div className="testimonial-card">
                        <p className="quote">“My specialist understood the niche topic perfectly and delivered ahead of schedule. Unbeatable expertise.”</p>
                        <p className="author">— Dr. Fatima E., Researcher</p>
                    </div>
                    <div className="testimonial-card">
                        <p className="quote">“The direct chat feature made the whole process stress-free. Fast response and exceptional support, 24/7.”</p>
                        <p className="author">— Chris R., Undergraduate</p>
                    </div>
                </div>
            </section>

            <section className="final-cta">
                <div className="cta-content">
                    <h2>Ready to Achieve Confidence in Your Academics?</h2>
                    <p>Unlock access to degree-holding specialists who guarantee zero AI and 100% original work.</p>
                    <Link
                        href={guestSessionKey ? `/categories?session_key=${String(guestSessionKey)}` : "/categories"}
                        className="btn primary large-cta-btn"
                    >
                        Start Your Task Now →
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;