import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function About() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      nav("/dashboard", { replace: true });
    }
  }, [loading, user, nav]);

  return (
    <main className="page content" role="main">
      <section className="about-wrap1">
        <h1 className="about-h1">
          About <span className="accent">PawFolio</span>
        </h1>
        <p className="about-lead">
          PawFolio is a cloud-hosted web gallery where pet lovers can upload, share,
          and browse adorable photos of their furry (and not-so-furry) friends. Built
          with Amazon Web Services (AWS), PawFolio demonstrates how cloud
          technologies—like EC2, S3, and RDS—can power a full-stack application that’s
          fun, functional, and scalable.
        </p>
      </section>

      <section className="about-wrap2">
        <h2 className="about-h2">What We Built</h2>
        <ul className="about-list">
          <li>
            <strong className="accent">Pet Gallery:</strong> A visually engaging
            gallery showcasing community-uploaded pet photos with names and
            descriptions.
          </li>
          <li>
            <strong className="accent">User Accounts:</strong> Secure registration and
            login system that allows each user to manage their personal uploads.
          </li>
          <li>
            <strong className="accent">Cloud Storage:</strong> All images are hosted
            in AWS S3 for scalability and performance, while pet data is managed
            through AWS RDS.
          </li>
          <li>
            <strong className="accent">Simple Upload System:</strong> Upload new pets
            instantly—name them, describe them, and share them with the community.
          </li>
          <li>
            <strong className="accent">Monitoring and Security:</strong> Uses IAM
            roles, CloudWatch, and secure access policies to ensure data safety and
            cost efficiency.
          </li>
        </ul>
      </section>

      <section className="about-wrap3">
        <h2 className="about-h2 accent">Our Mission</h2>
        <p>
          The goal of PawFolio is to combine technical learning with something joyful:
          our pets. It’s more than a demonstration of cloud computing—it’s a project
          that celebrates community, creativity, and technology. By developing PawFolio,
          we learned how to deploy, secure, and scale real web applications on AWS
          while creating a fun experience for users everywhere.
        </p>
      </section>
    </main>
  );
}
