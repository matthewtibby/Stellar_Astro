import { PricingCard } from '@/components/PricingCard';
import { CurrencyProvider } from '@/components/CurrencyProvider';

const FREE_FEATURES = [
  'Basic calibration tools',
  'Up to 3 active projects',
  'Watermarked exports',
  'Max 2K resolution exports',
  'Community support'
];

const PRO_MONTHLY_FEATURES = [
  'Full processing suite',
  'Unlimited projects',
  'No watermarks',
  'Full resolution exports',
  'Advanced calibration tools',
  'Priority support',
  '30-day storage retention'
];

const PRO_ANNUAL_FEATURES = [
  'Everything in Pro Monthly',
  '2 months free',
  '90-day storage retention',
  'Priority email support'
];

export default function Pricing() {
  return (
    <CurrencyProvider>
      <section className="py-24 relative">
        {/* Radial spotlight background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)] pointer-events-none z-0" />
        <div className="container relative z-10">
          <h2 className="text-3xl font-bold mb-12 text-center">Pricing Plans</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            <PricingCard
              title="Free"
              description="Perfect for getting started"
              price={0}
              interval="month"
              features={FREE_FEATURES}
            />
            <PricingCard
              title="Pro Monthly"
              description="Full access, monthly billing"
              price={15}
              interval="month"
              features={PRO_MONTHLY_FEATURES}
            />
            <PricingCard
              title="Pro Annual"
              description="Save 33% with annual billing"
              price={120}
              interval="year"
              features={PRO_ANNUAL_FEATURES}
              highlighted={true}
              badge="Best Value"
              savings="Save £60 per year"
            />
          </div>
        </div>
      </section>
    </CurrencyProvider>
  );
}
