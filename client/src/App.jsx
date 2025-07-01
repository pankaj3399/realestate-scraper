'use client'
import "./App.css";
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import Filters from "./components/Filters";
import Table from "./components/Table";

function App() {
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

  // Extract unique values from results
  // const uniquePropertyTypes = [...new Set(results.map(item => item.kind).filter(Boolean))].sort();
  // const uniqueRegions = [...new Set(results.map(item => item.region).filter(Boolean))].sort();
  // const uniqueMunicipalities = [...new Set(results.map(item => item.municipality).filter(Boolean))].sort();

  const handleScrape = async (params) => {
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
      
      if (data.results) {
        setResults(data.results);
        setTotalResults(data.total_results || data.results.length);
        if (params.selectedRegion && !data.results.results.some(item => item.region === params.selectedRegion && item.municipality === params.selectedMunicipality)) {
          setMunicipality("");
        }
      }
    } catch (err) {
      setHasSearched(true);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

    console.log(results,totalResults)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <SearchIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              Auction Scraper Dashboard
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Configure filters and scrape auction data with advanced search
            capabilities
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
            <span className="font-medium">Scraping in progress...</span>
          </div>
        )}

        {!isLoading && results.length > 0 && !error && (
          <div className="p-4 rounded-lg border mb-8 flex items-center gap-3 bg-green-50 text-green-600 border-green-200">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">Scraping complete!</span>
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
