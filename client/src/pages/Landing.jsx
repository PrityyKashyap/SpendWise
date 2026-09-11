import LandingNav from '../components/landing/LandingNav.jsx';
import Hero from '../components/landing/Hero.jsx';
import TrustStrip from '../components/landing/TrustStrip.jsx';
import ProblemSolution from '../components/landing/ProblemSolution.jsx';
import FeatureGrid from '../components/landing/FeatureGrid.jsx';
import AnalyticsShowcase from '../components/landing/AnalyticsShowcase.jsx';
import GroupShowcase from '../components/landing/GroupShowcase.jsx';
import BudgetShowcase from '../components/landing/BudgetShowcase.jsx';
import MoneyHealth from '../components/landing/MoneyHealth.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import Pricing from '../components/landing/Pricing.jsx';
import FinalCTA from '../components/landing/FinalCTA.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';

/**
 * The public marketing page at "/".
 *
 * Anyone can read it, logged in or not — the brief is explicit that arriving at
 * the root must not bounce a visitor straight to a login form. Signed-in users
 * still see it; the navbar simply swaps its two auth buttons for a single
 * "Go to dashboard".
 *
 * Every figure on this page comes from components/landing/demoData.js. Nothing
 * here calls the API, so there is no path by which a stranger's screen could
 * ever show a real person's finances.
 */
export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* First stop for keyboard and screen-reader users, who would otherwise
          tab through the entire navbar on every visit. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]
                   focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm
                   focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <LandingNav />

      <main id="main">
        <Hero />
        <TrustStrip />
        <ProblemSolution />
        <FeatureGrid />
        <AnalyticsShowcase />
        <GroupShowcase />
        <BudgetShowcase />
        <MoneyHealth />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
