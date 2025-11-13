import React from "react";

export default function About() {
  return (
    <main className="about-page page">
      <div className="container about-container">

        <div className="about-header">
          <h1 className="about-title">
            About <span className="accent">PawFolio</span>
          </h1>
          <p className="about-subtitle">
            A cloud-hosted pet gallery built for learning, sharing, and celebrating our furry friends.
          </p>
        </div>

        {/* WHAT WE BUILT */}
        <section className="about-section">
          <h2 className="about-section-title">What We Built</h2>

          <ul className="about-list">
            <li><strong>Pet Gallery:</strong> A friendly, community-driven space to upload and share pet photos.</li>
            <li><strong>User Accounts:</strong> Secure registration & login to manage personal uploads.</li>
            <li><strong>Cloud Storage:</strong> Images stored in AWS S3 for fast and scalable delivery.</li>
            <li><strong>Simple Upload System:</strong> Upload new pets instantly with names, descriptions, and tags.</li>
            <li><strong>Monitoring & Security:</strong> IAM roles, CloudWatch, and access policies protect data and privacy.</li>
          </ul>
        </section>

        {/* OUR MISSION */}
        <section className="about-section">
          <h2 className="about-section-title">Our Mission</h2>

          <p className="about-paragraph">
            PawFolio was created to combine technical learning with something joyful—our pets. 
            It’s more than a demonstration of cloud computing: it’s a project built to celebrate 
            creativity, community, and hands-on experience with real cloud infrastructure.
          </p>

          <p className="about-paragraph">
            By building PawFolio, we learned to deploy, secure, and scale modern full-stack 
            applications on AWS while creating an experience that brings people together through 
            the pets they love.
          </p>
        </section>

      </div>
    </main>
  );
}
