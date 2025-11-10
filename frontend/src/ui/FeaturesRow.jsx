const features = [
  {
    title: "Browse Movies",
    desc:
      "Tell us how you feel and we’ll match that mood to films that fit—not just by genre, " +
      "but by emotional tone. See ratings, summaries, and where to watch across major " +
      "streaming services in one place.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="6" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6"/>
      </svg>
    )
  },
  {
    title: "Create Watchlists",
    desc:
      "Save mood-matched picks to watch later, build a personal favorites list, and keep " +
      "track of what you’ve already seen. Your lists stay organized and easy to share.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    title: "Connect with Friends",
    desc:
      "Compare watchlists, share recommendations, and discover people with similar tastes. " +
      "Vote on movies to help friends decide what to watch next and surface the best picks.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="8" cy="9" r="3" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="16" cy="9" r="3" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M3.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M11 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    )
  },
];

export default function FeaturesRow(){
  return (


    <section className="features" role="region" aria-label="Features">
      {features.map((f) => (
        <article className="feature" key={f.title}>
          <span className="icon-square" aria-hidden="true">{f.icon}</span>
          <div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
