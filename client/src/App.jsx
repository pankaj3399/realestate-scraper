'use client'
import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Table as TableIcon,
  ExternalLink as ExternalLinkIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle as CheckCircleIcon,
  Loader as LoaderIcon,
  X as XIcon,
  Clock as ClockIcon,
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import Filters from "./components/Filters";
import Table from "./components/Table";
import LanguageSelector from "./components/LanguageSelector";
import Toaster from 'react-hot-toast'

const COOLDOWN_KEY = 'cooldownEndTime';
const RESULTS_KEY = 'auctionResults';

function App() {
  const { t } = useTranslation();
  const [results, setResults] = useState({ results: [], total_results: 0 });
  const [showTable, setShowTable] = useState(false);
  const [scrapingInProgress, setScrapingInProgress] = useState(false);
  // Filter state
  const [conductFrom, setConductFrom] = useState(null);
  const [conductTo, setConductTo] = useState(null);
  const [postingFrom, setPostingFrom] = useState(null);
  const [postingTo, setPostingTo] = useState(null);
  const [sortBy, setSortBy] = useState("auctionDateAsc");
  // Remove page and setPage state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New filter states
  const [propertyType, setPropertyType] = useState("");
  const [region, setRegion] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [lastScrapeParams, setLastScrapeParams] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(""); // new

  // Cooldown state for CAPTCHA protection
  const [cooldownEndTime, setCooldownEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Add state for startPage and endPage
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // On mount, restore results and cooldown from localStorage
  useEffect(() => {
    const storedResults = localStorage.getItem(RESULTS_KEY);
    if (storedResults) {
      const parsed = JSON.parse(storedResults);
      if (parsed.results && parsed.results.length > 0) {
        setResults(parsed);
        setShowTable(true);
      }
    }
    
    const storedCooldown = localStorage.getItem(COOLDOWN_KEY);
    if (storedCooldown && Number(storedCooldown) > Date.now()) {
      setCooldownEndTime(Number(storedCooldown));
    }
  }, []);

  // Persist results and cooldown to localStorage
  useEffect(() => {
    if (showTable && results.results.length > 0) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    } else {
      localStorage.removeItem(RESULTS_KEY);
    }

    if (cooldownEndTime && cooldownEndTime > Date.now()) {
      localStorage.setItem(COOLDOWN_KEY, cooldownEndTime);
    } else {
      localStorage.removeItem(COOLDOWN_KEY);
    }
  }, [results, cooldownEndTime, showTable]);

  // Update time left for cooldown
  useEffect(() => {
    if (!cooldownEndTime) {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = Date.now();
      const remaining = cooldownEndTime - now;
      
      if (remaining <= 0) {
        setCooldownEndTime(null);
        setTimeLeft(null);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [cooldownEndTime]);

  const handleScrape = useCallback(async (params) => {
    // Check if cooldown is active
    if (cooldownEndTime && Date.now() < cooldownEndTime) {
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoading) {
      return;
    }

    // Check if server URL is configured
    if (!import.meta.env.VITE_SERVER_URL) {
      setError('Server URL is not configured. Please check your environment variables.');
      return;
    }

    // Validate page numbers
    const { startPage: startPageParam, endPage: endPageParam } = params;
    const start = Number(startPageParam);
    const end = Number(endPageParam);

    if (isNaN(start) || isNaN(end)) {
      setError('Invalid page numbers provided.');
      return;
    }

    if (start < 1 || end < 1) {
      setError('Page numbers must be greater than 0.');
      return;
    }

    if (start > end) {
      setError('Start page cannot be greater than end page.');
      return;
    }

    setScrapingInProgress(true);
    setShowTable(false); // Hide table while scraping
    setIsLoading(true);
    setResults({ results: [], total_results: 0 });
    setError(null);
    setLastScrapeParams(params);
    setScrapingProgress("");

    let allResults = [];
    let totalAuctions = 0;

    for (let currentPage = start; currentPage <= end; currentPage++) {
      let progressMsg = '';
      if (start === end) {
        progressMsg = `Scraping page ${currentPage}...`;
      } else {
        progressMsg = `Scraping page ${currentPage} of ${end}...`;
      }
      setScrapingProgress(progressMsg);

      const requestData = {
        ...params,
        page: currentPage,
      };

      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        const data = await response.json();
        console.log(`Page ${currentPage} response:`, data); // Debug log

        if (!response.ok) {
          const errorMessage = data.error || data.message || 'Unknown error occurred';
          setError(`Error on page ${currentPage}: ${errorMessage}`);
          break; // Stop on error
        }

        if (data.error) {
          setError(`Error on page ${currentPage}: ${data.error}`);
          break; // Stop on error
        }

        if (data.results && Array.isArray(data.results)) {
          allResults = [...allResults, ...data.results];
          totalAuctions = data.total_results || allResults.length;
          setResults({ results: allResults, total_results: totalAuctions });
        } else {
          // Handle case where data.results is not as expected
          console.warn(`Unexpected data format on page ${currentPage}:`, data);
          if (Array.isArray(data)) {
            allResults = [...allResults, ...data];
          } else {
            console.error(`Invalid data format on page ${currentPage}:`, data);
          }
          totalAuctions = allResults.length;
          setResults({ results: allResults, total_results: totalAuctions });
        }

      } catch (err) {
        console.error(`Network error on page ${currentPage}:`, err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          setError(`Failed to connect to server. Please check if the server is running at ${import.meta.env.VITE_SERVER_URL}`);
        } else {
          setError(`Failed to scrape page ${currentPage}: ${err.message}`);
        }
        break; // Stop on error
      }

      // Add delay between pages to avoid captcha (6-8 minutes)
      if (currentPage < end) {
        const delayMinutes = Math.floor(Math.random() * 3) + 6; // Random 6-8 minutes
        const delayMs = delayMinutes * 60 * 1000;
        setScrapingProgress(`Waiting ${delayMinutes} minutes before next page to avoid captcha...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    setScrapingProgress(""); // Clear progress message
    setIsLoading(false);
    setHasSearched(true);
    setScrapingInProgress(false); // Done scraping
    setShowTable(true); // Only show table after results are fetched
    
    // Set cooldown only after all pages are scraped successfully
    if (!error) {
      const endTime = Date.now() + 480000;
      setCooldownEndTime(endTime);
      localStorage.setItem(COOLDOWN_KEY, endTime);
    }
  }, [isLoading, cooldownEndTime, error]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const clearResults = () => {
    setResults({ results: [], total_results: 0 });
    setShowTable(false);
    localStorage.removeItem(RESULTS_KEY);
  };

  const clearFilters = () => {
    setConductFrom(null);
    setConductTo(null);
    setPostingFrom(null);
    setPostingTo(null);
    setSortBy("auctionDateAsc");
    setStartPage(1); // Reset startPage
    setEndPage(1); // Reset endPage
    setPropertyType("");
    setRegion("");
    setMunicipality("");
  };

  // Get municipalities for selected region
  // const filteredMunicipalities = region 
    // ? uniqueMunicipalities.filter(mun => 
        // results.some(item => item.region === region && item.municipality === mun)
      // )
    // : uniqueMunicipalities;

  // Check if any filters are active
  const hasActiveFilters = conductFrom || conductTo || postingFrom || postingTo || 
    sortBy !== "auctionDateAsc" || startPage !== 1 || propertyType || region || municipality;

  // Check if scraping is disabled due to cooldown
  const isScrapingDisabled = isLoading || (cooldownEndTime && Date.now() < cooldownEndTime);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* <Toaster   position="top-center" reverseOrder={false} /> */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <SearchIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
                {t('auctionScraperDashboard')}
            </h1>
            </div>
            <LanguageSelector />
          </div>
          <p className="text-gray-600 text-lg text-left">
            {t('configureFiltersAndScrape')}
          </p>
        </div>

        <Filters
          conductFrom={conductFrom}
          setConductFrom={setConductFrom}
          conductTo={conductTo}
          setConductTo={setConductTo}
          postingFrom={postingFrom}
          setPostingFrom={setPostingFrom}
          postingTo={postingTo}
          setPostingTo={setPostingTo}
          sortBy={sortBy}
          setSortBy={setSortBy}
          startPage={startPage}
          setStartPage={setStartPage}
          endPage={endPage}
          setEndPage={setEndPage}
          onScrape={handleScrape}
          isLoading={isLoading}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          isScrapingDisabled={isScrapingDisabled}
          timeLeft={timeLeft}
        />

        {error && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-red-50 text-red-600 border-red-200">
            <AlertCircleIcon className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {isLoading && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-blue-50 text-blue-600 border-blue-200">
            <LoaderIcon className="w-5 h-5 animate-spin" />
            <span className="font-medium">{scrapingProgress || t('scrapingInProgress')}</span>
          </div>
        )}

        {!isLoading && results.results.length > 0 && !error && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-green-50 text-green-600 border-green-200">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">{t('scrapingComplete')}</span>
          </div>
        )}

        {cooldownEndTime && Date.now() < cooldownEndTime && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-yellow-50 text-yellow-700 border-yellow-200">
            <ClockIcon className="w-5 h-5" />
            <span className="font-medium">
              {t('waitBeforeNextScrape', { timeLeft })}
            </span>
          </div>
        )}

        {scrapingInProgress ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
            <LoaderIcon className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">{scrapingProgress || t('scrapingInProgress')}</h3>
          </div>
        ) : showTable ? (
          <Table
            results={results}
            hasSearched={hasSearched}
            clearResults={clearResults}
            page={currentPage}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">{t('noDataFetched')}</h3>
            <p className="text-gray-500 mt-2">{t('startScrapeToSeeResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
