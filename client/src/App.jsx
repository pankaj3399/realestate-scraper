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

const COOLDOWN_KEY = 'cooldownEndTime';

function App() {
  const { t } = useTranslation();
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  // Filter state
  const [conductFrom, setConductFrom] = useState(null);
  const [conductTo, setConductTo] = useState(null);
  const [postingFrom, setPostingFrom] = useState(null);
  const [postingTo, setPostingTo] = useState(null);
  const [sortBy, setSortBy] = useState("auctionDateAsc");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New filter states
  const [propertyType, setPropertyType] = useState("");
  const [region, setRegion] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [lastScrapeParams, setLastScrapeParams] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Cooldown state for CAPTCHA protection
  const [cooldownEndTime, setCooldownEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // On mount, restore cooldown from localStorage if present
  useEffect(() => {
    const stored = localStorage.getItem(COOLDOWN_KEY);
    if (stored && Number(stored) > Date.now()) {
      setCooldownEndTime(Number(stored));
    }
  }, []);

  // Persist cooldownEndTime to localStorage whenever it changes
  useEffect(() => {
    if (cooldownEndTime && cooldownEndTime > Date.now()) {
      localStorage.setItem(COOLDOWN_KEY, cooldownEndTime);
    } else {
      localStorage.removeItem(COOLDOWN_KEY);
    }
  }, [cooldownEndTime]);

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

    setIsLoading(true);
    setResults([]);
    setError(null);
    setLastScrapeParams(params); // Save last used params for pagination

    const requestData = {
      conductFrom: params.conductFrom,
      conductTo: params.conductTo,
      postingFrom: params.postingFrom,
      postingTo: params.postingTo,
      sortBy: params.sortBy,
      page: params.page,
      regionParam: params.regionParam,
      propertyParam: params.propertyParam,
      municipalityParam: params.municipalityParam,
      selectedRegion: params.selectedRegion,
      selectedMunicipality: params.selectedMunicipality,
      selectedPropertyType: params.selectedPropertyType,
    };

    console.log("Sending request with data:", requestData);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      setHasSearched(true);
      console.log("Received response:", data);

      // Handle backend error (like missing Gemini key)
      if (!response.ok && data.error) {
        setError(data.error);
        setResults([]);
        setTotalResults(0);
        return;
      }

      if (data.results) {
        setResults(data.results);
        setTotalResults(data.total_results || data.results.length);
        if (params.selectedRegion && !data.results.results.some(item => item.region === params.selectedRegion && item.municipality === params.selectedMunicipality)) {
          setMunicipality("");
        }
        // Set cooldown after successful scrape (8 minutes = 480000ms)
        const endTime = Date.now() + 480000;
        setCooldownEndTime(endTime);
        localStorage.setItem(COOLDOWN_KEY, endTime);
      }

    } catch (err) {
      setHasSearched(true);
      setError(err.message);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, cooldownEndTime]);

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (!lastScrapeParams) return;
    setPage(newPage);
    handleScrape({ ...lastScrapeParams, page: newPage });
  };

  const clearFilters = () => {
    setConductFrom(null);
    setConductTo(null);
    setPostingFrom(null);
    setPostingTo(null);
    setSortBy("auctionDateAsc");
    setPage(1);
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
    sortBy !== "auctionDateAsc" || page !== 1 || propertyType || region || municipality;

  // Check if scraping is disabled due to cooldown
  const isScrapingDisabled = isLoading || (cooldownEndTime && Date.now() < cooldownEndTime);

    console.log(results,totalResults)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
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
          <p className="text-gray-600 text-lg">
            {t('configureFiltersAndScrape')}
          </p>
        </div>

        {/* Pre-scraping Filters */}
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
          page={page}
          setPage={setPage}
          onScrape={handleScrape}
          isLoading={isLoading}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          isScrapingDisabled={isScrapingDisabled}
          timeLeft={timeLeft}
        />

        {/* Status Messages */}
        {error && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-red-50 text-red-600 border-red-200">
            <AlertCircleIcon className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {isLoading && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-blue-50 text-blue-600 border-blue-200">
            <LoaderIcon className="w-5 h-5 animate-spin" />
            <span className="font-medium">{t('scrapingInProgress')}</span>
          </div>
        )}

        {!isLoading && results.length > 0 && !error && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-green-50 text-green-600 border-green-200">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">{t('scrapingComplete')}</span>
          </div>
        )}

        {/* Cooldown Warning */}
        {cooldownEndTime && Date.now() < cooldownEndTime && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-yellow-50 text-yellow-700 border-yellow-200">
            <ClockIcon className="w-5 h-5" />
            <span className="font-medium">
              {t('waitBeforeNextScrape', { timeLeft })}
            </span>
          </div>
        )}

        {/* Results Table with Post-scraping Filters */}
        <Table
          results={results}
          totalResults={totalResults}
          page={page}
          onPageChange={handlePageChange}
          hasSearched={hasSearched}
        />
      </div>
    </div>
  );
}

export default App;
