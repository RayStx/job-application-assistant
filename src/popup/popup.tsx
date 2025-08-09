import React, { useState, useEffect } from 'react';
import { JobParser } from '@/lib/ai/jobParser';
import { ApplicationStorage } from '@/lib/storage/applications';
import type { JobApplication, ParseJobResponse } from '@/types';

export function Popup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStored, setApiKeyStored] = useState(false);
  const [parsedJob, setParsedJob] = useState<ParseJobResponse | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    loadConfig();
    getCurrentTabUrl();
  }, []);

  const loadConfig = async () => {
    try {
      const storage = new ApplicationStorage();
      const config = await storage.getConfig();
      if (config.openaiApiKey) {
        setApiKey(config.openaiApiKey);
        setApiKeyStored(true);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const getCurrentTabUrl = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tabs[0]?.url || '';
      setCurrentUrl(url);
    } catch (error) {
      console.error('Failed to get current tab URL:', error);
    }
  };

  const saveApiKey = async () => {
    try {
      const storage = new ApplicationStorage();
      await storage.saveConfig({ openaiApiKey: apiKey });
      setApiKeyStored(true);
      setError('✅ API key saved successfully!');
      setTimeout(() => setError(''), 2000);
    } catch (error) {
      setError('Failed to save API key');
    }
  };

  const parseCurrentPage = async () => {
    if (!apiKey) {
      setError('Please enter your OpenAI API key first');
      return;
    }

    setLoading(true);
    setError('');
    setParsedJob(null);

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (!currentTab?.id || !currentTab.url) {
        throw new Error('Could not access current tab');
      }

      const parser = new JobParser({ apiKey, model: 'gpt-4-turbo-preview' });
      const content = await parser.extractPageContent(currentTab.id);
      
      if (!content.trim()) {
        throw new Error('No content found on this page');
      }

      const result = await parser.parseJobPosting({
        content,
        url: currentTab.url
      });

      setParsedJob(result);
    } catch (error) {
      console.error('Parsing failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to parse job posting');
    } finally {
      setLoading(false);
    }
  };

  const saveJobApplication = async () => {
    if (!parsedJob) return;

    try {
      const storage = new ApplicationStorage();
      const application: JobApplication = {
        id: crypto.randomUUID(),
        title: parsedJob.title,
        company: parsedJob.company,
        url: currentUrl,
        description: parsedJob.description,
        requirements: parsedJob.requirements,
        salary: parsedJob.salary || '',
        location: parsedJob.location,
        workType: parsedJob.workType,
        datePosted: parsedJob.datePosted || '',
        positionId: parsedJob.positionId,
        status: 'saved',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await storage.save(application);
      setError('');
      
      // Show success message briefly
      const originalError = error;
      setError('✅ Job application saved!');
      setTimeout(() => setError(originalError), 2000);
    } catch (error) {
      setError('Failed to save job application');
    }
  };

  const openDashboard = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html')
    });
  };

  return (
    <div className="w-96 p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Job Assistant</h1>
        <button
          onClick={openDashboard}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Dashboard
        </button>
      </div>

      {!apiKeyStored && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800 mb-2">
            Enter your OpenAI API key (one-time setup):
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={saveApiKey}
              disabled={!apiKey.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className={`mb-4 p-3 rounded text-sm ${
          error.includes('✅') 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={parseCurrentPage}
          disabled={loading || !apiKeyStored}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Parsing Job...' : 'Parse Current Page'}
        </button>
      </div>

      {parsedJob && (
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-gray-900">{parsedJob.title}</h3>
            <p className="text-sm text-gray-600">{parsedJob.company}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">
              {parsedJob.location} • {parsedJob.workType}
            </p>
            {parsedJob.salary && (
              <p className="text-sm text-gray-600">{parsedJob.salary}</p>
            )}
          </div>

          {parsedJob.requirements.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Key Requirements:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {parsedJob.requirements.slice(0, 3).map((req, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={saveJobApplication}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Job Application
          </button>
        </div>
      )}

      {currentUrl && !loading && !parsedJob && apiKeyStored && (
        <div className="text-center text-sm text-gray-500">
          Ready to parse: {new URL(currentUrl).hostname}
        </div>
      )}
    </div>
  );
}