"use client";

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

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
      <CurrencyProvider>
        {/* Hero Section */}
        <section className="py-24 relative">
          <div className="container">
            <h1 className="text-5xl md:text-6xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-center text-gray-400 max-w-2xl mx-auto">
              Choose the plan that works best for you. All plans include access to our core features.
            </p>
          </div>
        </section>

        {/* Pricing Tables */}
        <section className="py-24 relative">
          <div className="container relative">
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

        {/* Feature Comparison */}
        <section className="py-24 relative">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Compare Features
            </h2>
            <div className="max-w-4xl mx-auto bg-black/50 rounded-2xl border border-gray-800 p-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 text-gray-400">Feature</th>
                    <th className="text-center py-4 text-gray-400">Free</th>
                    <th className="text-center py-4 text-primary">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="py-4">Projects</td>
                    <td className="text-center text-gray-400">3 max</td>
                    <td className="text-center text-white">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4">Export Resolution</td>
                    <td className="text-center text-gray-400">Up to 2K</td>
                    <td className="text-center text-white">Full Resolution</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4">Watermark</td>
                    <td className="text-center text-gray-400">Yes</td>
                    <td className="text-center text-white">No</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4">Storage Retention</td>
                    <td className="text-center text-gray-400">7 days</td>
                    <td className="text-center text-white">30-90 days</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4">Support</td>
                    <td className="text-center text-gray-400">Community</td>
                    <td className="text-center text-white">Priority</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 relative">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-black/50 rounded-2xl border border-gray-800 p-8">
                <h3 className="text-xl font-bold mb-4">Can I switch between monthly and annual billing?</h3>
                <p className="text-gray-400">Yes, you can switch between billing periods at any time. If you switch to annual, you'll be prorated for the remaining time.</p>
              </div>
              <div className="bg-black/50 rounded-2xl border border-gray-800 p-8">
                <h3 className="text-xl font-bold mb-4">What payment methods do you accept?</h3>
                <p className="text-gray-400">We accept all major credit cards and PayPal. Payments are processed securely through Stripe.</p>
              </div>
              <div className="bg-black/50 rounded-2xl border border-gray-800 p-8">
                <h3 className="text-xl font-bold mb-4">Can I cancel my subscription?</h3>
                <p className="text-gray-400">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
              </div>
              <div className="bg-black/50 rounded-2xl border border-gray-800 p-8">
                <h3 className="text-xl font-bold mb-4">What happens to my projects if I downgrade?</h3>
                <p className="text-gray-400">Your projects will be preserved but export options will be limited. You'll need to reduce your active projects to 3 or fewer.</p>
              </div>
            </div>
          </div>
        </section>
      </CurrencyProvider>
    </div>
  );
} 