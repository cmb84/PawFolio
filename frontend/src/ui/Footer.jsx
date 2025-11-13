export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-bar">
        {/* === Left side: brand logo and name === */}
        <div className="logo-lockup">
        </div>

        {/* === Center text === */}
        <div className="footer-center">
          <p>
            © {new Date().getFullYear()} PawFolio — Made with ❤️ by Team
            PawFolio
          </p>
        </div>

        {/* === Right side: contact + socials === */}
        <div className="footer-right">
          <a
            href="mailto:team@pawfolio.com"
            className="footer-contact"
            title="Email us"
          >
            📧 team@pawfolio.com
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="social"
            title="GitHub"
          >
            <span className="footer-icon"></span>
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="social"
            title="Instagram"
          >
            🐾
          </a>
        </div>
      </div>
    </footer>
  );
}
