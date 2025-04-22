"use client";

import { useState } from 'react';
import { useUserStore } from '@/src/store/user';
import { UserState } from '@/src/types/store';
import { useCurrency } from '@/components/CurrencyProvider';
import { formatPrice } from '@/lib/currency';
import { Check, AlertTriangle, CreditCard, Calendar, Pause, Play } from 'lucide-react';

interface SubscriptionTabProps {
  user: UserState | null;
}

export default function SubscriptionTab({ user }: SubscriptionTabProps) {
  const { setUser } = useUserStore();
  const { currency } = useCurrency();
  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Subscription details
  const subscription = user?.subscription || { type: 'free', projectLimit: 3 };
  const isFree = subscription.type === 'free';
  const isPro = subscription.type === 'pro';

  // Subscription pricing
  const pricing = {
    'pro-monthly': 15,
    'pro-annual': 120
  };

  const handleUpgrade = async (plan: 'pro-monthly' | 'pro-annual') => {
    try {
      // Here you would typically redirect to a payment page or open a payment modal
      console.log(`Upgrading to ${plan}`);
      
      // For demo purposes, we'll just update the local state
      const updatedUser = {
        ...user,
        subscription: {
          type: 'pro',
          projectLimit: 50
        }
      } as UserState;
      
      setUser(updatedUser);
      setMessage({ type: 'success', text: `Successfully upgraded to ${plan}` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upgrade subscription' });
      console.error('Error upgrading subscription:', error);
    }
  };

  const handlePauseSubscription = async () => {
    try {
      // Here you would typically make an API call to pause the subscription
      setIsPaused(true);
      setMessage({ type: 'success', text: 'Subscription paused successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to pause subscription' });
      console.error('Error pausing subscription:', error);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      // Here you would typically make an API call to resume the subscription
      setIsPaused(false);
      setMessage({ type: 'success', text: 'Subscription resumed successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resume subscription' });
      console.error('Error resuming subscription:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      // Here you would typically make an API call to cancel the subscription
      const updatedUser = {
        ...user,
        subscription: {
          type: 'free',
          projectLimit: 3
        }
      } as UserState;
      
      setUser(updatedUser);
      setShowCancelConfirm(false);
      setMessage({ type: 'success', text: 'Subscription cancelled successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
      console.error('Error cancelling subscription:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Subscription Management</h2>
      </div>

      {message && (
        <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Current Plan</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium capitalize">{subscription.type} Plan</p>
            <p className="text-gray-400 text-sm">
              {isFree ? 'Free tier' : 'Pro subscription'}
            </p>
          </div>
          <div className="text-right">
            {isFree ? (
              <p className="text-white font-medium">Free</p>
            ) : (
              <p className="text-white font-medium">
                {formatPrice(pricing['pro-monthly'], currency)}/month
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center text-sm text-gray-300">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span>Up to {subscription.projectLimit} active projects</span>
          </div>
          {!isFree && (
            <>
              <div className="flex items-center text-sm text-gray-300 mt-2">
                <CreditCard className="h-4 w-4 text-green-500 mr-2" />
                <span>Billed monthly</span>
              </div>
              <div className="flex items-center text-sm text-gray-300 mt-2">
                <Calendar className="h-4 w-4 text-green-500 mr-2" />
                <span>Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
            </>
          )}
        </div>

        {!isFree && (
          <div className="mt-6 flex space-x-3">
            {isPaused ? (
              <button
                onClick={handleResumeSubscription}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume Subscription
              </button>
            ) : (
              <button
                onClick={handlePauseSubscription}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause Subscription
              </button>
            )}
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Options */}
      {!isPro && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Upgrade Your Plan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isPro && (
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium">Pro Monthly</h4>
                <p className="text-2xl font-bold text-white mt-2">{formatPrice(pricing['pro-monthly'], currency)}<span className="text-sm text-gray-400">/month</span></p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5 mr-2" />
                    <span>Up to 50 active projects</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5 mr-2" />
                    <span>Advanced processing features</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5 mr-2" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('pro-monthly')}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
            
            {!isPro && (
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium">Pro Annual</h4>
                <p className="text-2xl font-bold text-white mt-2">{formatPrice(pricing['pro-annual'], currency)}<span className="text-sm text-gray-400">/year</span></p>
                <p className="text-green-400 text-sm">Save 33% compared to monthly</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5 mr-2" />
                    <span>All Pro Monthly features</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5 mr-2" />
                    <span>2 months free</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5 mr-2" />
                    <span>Extended storage retention</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('pro-annual')}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro Annual
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-semibold text-white">Cancel Subscription</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 