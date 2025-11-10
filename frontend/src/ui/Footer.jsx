import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-bar">
        <div className="footer-left">
          © {year} Moodvies • “Give us your mood, we give you the movies.”
        </div>

        <div className="footer-right">
          <a
            className="footer-contact"
            href="https://github.com/IT490-101FA25/Capstone-Group-07/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact
          </a>

          <a
            className="social"
            href="https://github.com/IT490-101FA25/Capstone-Group-07"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            title="GitHub"
          >
            <span className="footer-icon" aria-hidden="true"></span>
            <span className="sr-only">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
