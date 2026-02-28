import { CheckCircle, Users, Zap, Shield, Award, TrendingUp, MessageCircle, Clock } from "lucide-react";
import "./About.scss";

const About = () => {
  const features = [
    {
      icon: <Users size={24} />,
      title: "Expert Network",
      description: "Connect with verified professionals across multiple academic disciplines"
    },
    {
      icon: <Zap size={24} />,
      title: "Fast Delivery",
      description: "Get quality work delivered on time, every time"
    },
    {
      icon: <Shield size={24} />,
      title: "Secure Platform",
      description: "Your data and transactions are protected with industry-leading security"
    },
    {
      icon: <Award size={24} />,
      title: "Quality Guaranteed",
      description: "All work is reviewed and meets our high standards"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Choose Your Category",
      description: "Browse through our categories and select the service you need"
    },
    {
      step: "2",
      title: "Connect with Experts",
      description: "Review expert profiles and start a conversation with your chosen professional"
    },
    {
      step: "3",
      title: "Get Quality Work",
      description: "Receive your completed work on time and with guaranteed quality"
    }
  ];

  const stats = [
    { icon: <Users size={32} />, value: "1000+", label: "Active Experts" },
    { icon: <TrendingUp size={32} />, value: "10,000+", label: "Projects Completed" },
    { icon: <MessageCircle size={32} />, value: "24/7", label: "Support Available" },
    { icon: <Clock size={32} />, value: "2-48hrs", label: "Average Delivery" }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">About RemyInk!</h1>
          <p className="hero-subtitle">
            Your trusted academic services marketplace connecting students and professionals
            with expert help for essays, tutoring, assignments, and more.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="section-container">
          <div className="mission-content">
            <h2 className="section-title">Our Mission</h2>
            <p className="mission-text">
              RemyInk! was built to bridge the gap between those seeking academic assistance
              and qualified experts ready to help. We believe in making quality academic support
              accessible, affordable, and secure for everyone.
            </p>
            <p className="mission-text">
              Our platform empowers students to achieve their academic goals while providing
              professionals with opportunities to share their expertise and earn income doing
              what they love.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Why Choose RemyInk!</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            {howItWorks.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{step.step}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="step-connector"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="section-container">
          <h2 className="section-title">Our Core Values</h2>
          <div className="values-list">
            <div className="value-item">
              <CheckCircle className="value-icon" size={20} />
              <div className="value-content">
                <h3 className="value-title">Quality First</h3>
                <p className="value-description">
                  We maintain the highest standards for all work delivered through our platform
                </p>
              </div>
            </div>
            <div className="value-item">
              <CheckCircle className="value-icon" size={20} />
              <div className="value-content">
                <h3 className="value-title">Transparency</h3>
                <p className="value-description">
                  Clear communication and honest pricing with no hidden fees
                </p>
              </div>
            </div>
            <div className="value-item">
              <CheckCircle className="value-icon" size={20} />
              <div className="value-content">
                <h3 className="value-title">Trust & Security</h3>
                <p className="value-description">
                  Your privacy and security are our top priorities
                </p>
              </div>
            </div>
            <div className="value-item">
              <CheckCircle className="value-icon" size={20} />
              <div className="value-content">
                <h3 className="value-title">Customer Success</h3>
                <p className="value-description">
                  We're dedicated to helping you achieve your academic goals
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-description">
              Join thousands of students and professionals already using RemyInk!
            </p>
            <div className="cta-buttons">
              <a href="/categories" className="btn-primary">Browse Categories</a>
              <a href="/register" className="btn-secondary">Sign Up Now</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
