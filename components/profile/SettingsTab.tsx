"use client";

import { useState } from 'react';
import { Settings, Bell, Globe, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsTab() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Application Settings</h2>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Preferences</h3>
        
        {/* Theme Settings */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Moon className="h-5 w-5 text-gray-300 mr-2" />
            <h4 className="text-white font-medium">Theme</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-md flex flex-col items-center ${
                theme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Sun className="h-5 w-5 mb-1" />
              <span className="text-xs">Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-md flex flex-col items-center ${
                theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Moon className="h-5 w-5 mb-1" />
              <span className="text-xs">Dark</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-3 rounded-md flex flex-col items-center ${
                theme === 'system' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Monitor className="h-5 w-5 mb-1" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Bell className="h-5 w-5 text-gray-300 mr-2" />
            <h4 className="text-white font-medium">Notifications</h4>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded-md">
            <span className="text-gray-300">Enable notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Language Settings */}
        <div>
          <div className="flex items-center mb-2">
            <Globe className="h-5 w-5 text-gray-300 mr-2" />
            <h4 className="text-white font-medium">Language</h4>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 bg-slate-700 text-gray-300 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
            <option value="ru">Русский</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Advanced Settings</h3>
        <p className="text-gray-400 mb-4">
          Advanced settings will be available in future updates. Check back soon for more customization options.
        </p>
        <div className="flex items-center text-sm text-gray-400">
          <Settings className="h-4 w-4 mr-2" />
          <span>More settings coming soon</span>
        </div>
      </div>
    </div>
  );
} 