import React, { useState, useMemo } from "react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Grid3X3,
  ExternalLink,
  AlertCircle,
  FileText,
  MapPin,
  Calendar,
  Euro,
  Home,
  User,
  Filter,
  X,
  Download,
  BookText,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import MultiSelect from "./ui/multi-select";
import { Button } from "./ui/button";

const Table = ({
  results = { results: [], total_results: 0 },
  page,
  onPageChange,
  hasSearched,
}) => {
  const { t } = useTranslation();
  const resultArray = Array.isArray(results.results) ? results.results : [];
  const totalResults = results.total_results || 0;
  // Post-scraping filter states
  const [filters, setFilters] = useState({
    codeSearch: "",
    descriptionSearch: "",
    property_type: [],
    region: [],
    municipality: [],
    occupancy_status: [],
    price: { min: "", max: "" },
    property_area: { min: "", max: "" },
    price_per_sqm: { min: "", max: "" },
  });
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 20;

  // Modal State
  const [modalData, setModalData] = useState(null);

  // Helper function to format price consistently
  const formatPrice = (price) => {
    if (!price || price === "N/A") return "N/A";

    // Remove early return for strings containing '€' to always normalize
    // If it's a number, format it
    if (typeof price === "number") {
      return `€${price.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }

    // Try to extract number from string and format
    const numericValue = parseFloat(
      String(price).replace(/[\d.,]+/g, (match) =>
        match.replace(/\./g, "").replace(/,/g, ".")
      )
    );
    if (!isNaN(numericValue)) {
      return `€${numericValue.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }

    return String(price);
  };

  // Helper function to get numeric value from price for filtering
  const getNumericPrice = (price) => {
    if (!price || price === "N/A") return 0;

    if (typeof price === "number") return price;

    // Convert Greek format to float (e.g., 60.800,00 € -> 60800.00)
    const cleaned = String(price).replace(/[^\d.,-]/g, "");
    if (cleaned.includes(",") && cleaned.includes(".")) {
      // Greek format: 94.000,50
      const parts = cleaned.split(",");
      if (parts.length === 2) {
        const integerPart = parts[0].replace(/\./g, "");
        const decimalPart = parts[1];
        return parseFloat(`${integerPart}.${decimalPart}`);
      }
    } else if (cleaned.includes(",") && !cleaned.includes(".")) {
      // Only comma (decimal separator): 94,50
      return parseFloat(cleaned.replace(",", "."));
    } else if (cleaned.includes(".") && !cleaned.includes(",")) {
      // Check if it's thousands separator or decimal
      const parts = cleaned.split(".");
      if (parts.length > 2) {
        // Multiple periods = thousands separators: 1.234.567
        return parseFloat(cleaned.replace(/\./g, ""));
      } else if (parts.length === 2 && parts[1].length === 3) {
        // Likely thousands separator: 94.000
        return parseFloat(cleaned.replace(/\./g, ""));
      }
      // If decimal part has 1-2 digits, keep as decimal: 94.5 or 94.50
      return parseFloat(cleaned);
    }
    // Fallback
    return parseFloat(cleaned);
  };

  // Filter results based on selected filters
  const filteredResults = useMemo(() => {
    // Ensure resultArray is an array
    if (!Array.isArray(resultArray)) {
      console.log("resultArray is not an array:", resultArray);
      return [];
    }

    return resultArray.filter((item) => {
      // Skip error items in filtering
      if (item.error) return true;

      // Code Search
      if (filters.codeSearch && !item.code?.toLowerCase().includes(filters.codeSearch.toLowerCase())) return false;
      
      // Description/Notes Search
      if (filters.descriptionSearch) {
        const searchTerm = filters.descriptionSearch.toLowerCase();
        const searchableFields = [
          item.property_description,
          item.notes,
        ].join(' ').toLowerCase();

        if (!searchableFields.includes(searchTerm)) return false;
      }

      // Property Type filter
      if (filters.property_type.length > 0 && !filters.property_type.includes(item.kind)) return false;
      
      // Region filter
      if (filters.region.length > 0 && !filters.region.includes(item.region)) return false;
      
      // Municipality filter
      if (filters.municipality.length > 0 && !filters.municipality.includes(item.municipality)) return false;
      
      // Occupancy status filter
      if (filters.occupancy_status.length > 0 && !filters.occupancy_status.includes(item.occupancy_status)) return false;
      
      // Price filter
      const numericPrice = getNumericPrice(item.price);
      if (filters.price.min && numericPrice < parseFloat(filters.price.min)) return false;
      if (filters.price.max && numericPrice > parseFloat(filters.price.max)) return false;

      // Area filter
      if (filters.property_area.min && item.property_area < parseFloat(filters.property_area.min)) return false;
      if (filters.property_area.max && item.property_area > parseFloat(filters.property_area.max)) return false;

      // Price per m² filter
      const numericPricePerSqm = getNumericPrice(item.price_per_sqm);
      if (filters.price_per_sqm.min && numericPricePerSqm < parseFloat(filters.price_per_sqm.min)) return false;
      if (filters.price_per_sqm.max && numericPricePerSqm > parseFloat(filters.price_per_sqm.max)) return false;

      return true;
    });
  }, [resultArray, filters]);

  // Headers for CSV/Excel export
  const headers = [
    { label: "AI Label", key: "ai_labels" },
    { label: "Simple Tag", key: "simple_tag" },
    { label: "Code", key: "code" },
    { label: "Part #", key: "part_number" },
    { label: t("date"), key: "date" },
    { label: "Post Date", key: "post_date" },
    { label: t("price"), key: "price" },
    { label: "Auction Object", key: "auction_object" },
    { label: t("propertyType"), key: "property_type" },
    { label: "Address", key: "address" },
    { label: "Area (m²)", key: "property_area" },
    { label: "Price per m²", key: "price_per_sqm" },
    { label: "Occupancy", key: "occupancy_status" },
    { label: "Description", key: "property_description" },
    { label: "Notes", key: "notes" },
    { label: "All PDFs", key: "excel_pdf_links" },
    { label: "URL", key: "detail_link" },
  ];

  // Prepare data for export
  const exportData = useMemo(() => {
    return filteredResults
      .filter((item) => !item.error) // Exclude error rows
      .map((item) => {
        let excelPdfLinks = "";
        if (item.all_pdf_links && item.all_pdf_links.length > 0) {
          excelPdfLinks = item.all_pdf_links.join(", ");
        } else {
          excelPdfLinks = "No PDFs";
        }
        return {
          ...item,
          ai_labels: (item.ai_labels || []).join(", "), // Convert array to string
          price: formatPrice(item.price), // Format price for consistency
          excel_pdf_links: excelPdfLinks, // Only this column for all PDFs
        };
      });
  }, [filteredResults]);

  const handleExcelExport = () => {
    const worksheetData = exportData.map((item) => {
      let row = {};
      headers.forEach((header) => {
        row[header.label] = item[header.key];
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auctions");
    XLSX.writeFile(workbook, "AuctionResults.xlsx");
  };

  // Extract unique values from results - with safety checks
  const uniquePropertyTypes = useMemo(
    () =>
      [
        ...new Set(
          resultArray
            .filter((item) => item && item.kind) // Add safety check
            .map((item) => item.kind)
            .filter((kind) => kind && kind !== "N/A")
        ),
      ].sort(),
    [resultArray]
  );

  const uniqueRegions = useMemo(
    () =>
      [
        ...new Set(
          resultArray
            .filter((item) => item && item.region) // Add safety check
            .map((item) => item.region)
            .filter((region) => region && region !== "N/A")
        ),
      ].sort(),
    [resultArray]
  );

  const uniqueMunicipalities = useMemo(() => {
    const municipalities = resultArray
        .filter((item) => item && item.municipality)
        .map((item) => item.municipality)
        .filter((municipality) => municipality && municipality !== "N/A");

    return [...new Set(municipalities)].sort();
  }, [resultArray]);

  const uniqueOccupancyStatuses = useMemo(
    () =>
      [
        ...new Set(
          resultArray
            .filter((item) => item && item.occupancy_status) // Add safety check
            .map((item) => item.occupancy_status)
            .filter((status) => status && status !== "N/A")
        ),
      ].sort(),
    [resultArray]
  );

  const clearPostFilters = () => {
    setFilters({
      codeSearch: "",
      descriptionSearch: "",
      property_type: [],
      region: [],
      municipality: [],
      occupancy_status: [],
      price: { min: "", max: "" },
      property_area: { min: "", max: "" },
      price_per_sqm: { min: "", max: "" },
    });
  };

  const hasActiveFilters =
    filters.codeSearch ||
    filters.descriptionSearch ||
    filters.property_type.length > 0 ||
    filters.region.length > 0 ||
    filters.municipality.length > 0 ||
    filters.occupancy_status.length > 0 ||
    filters.price.min || filters.price.max ||
    filters.property_area.min || filters.property_area.max ||
    filters.price_per_sqm.min || filters.price_per_sqm.max;

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / resultsPerPage));

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage]);

  // Reset page to 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  if (
    hasSearched &&
    (!Array.isArray(resultArray) || resultArray.length === 0)
  ) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("noResults")}
        </h3>
        <p className="text-gray-500">{t("noResults")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header and Filters */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Grid3X3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("auctionResults")}
                </h2>
                <p className="text-sm text-gray-600">
                  {t("showing")} {filteredResults.length} {t("of")}{" "}
                  {resultArray.length} {t("results")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
              >
                {isFiltersVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {t("advancedFilters")}
              </button>
              <CSVLink
                data={exportData}
                headers={headers}
                filename={"AuctionResults.csv"}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                {t("exportToCSV")}
              </CSVLink>
              <button
                onClick={handleExcelExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                {t("exportToExcel")}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearPostFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  {t("clearFilters")}
                </button>
              )}
            </div>
          </div>

          {isFiltersVisible && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 border-t border-gray-200">
              {/* Code Search */}
              <div className="xl:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  Code Search
                </label>
                <input
                  type="text"
                  placeholder="Search by code..."
                  value={filters.codeSearch}
                  onChange={(e) => setFilters(prev => ({ ...prev, codeSearch: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description/Notes Search */}
              <div className="xl:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <BookText className="w-4 h-4" />
                  Description & Notes Search
                </label>
                <input
                  type="text"
                  placeholder="Search in descriptions and notes..."
                  value={filters.descriptionSearch}
                  onChange={(e) => setFilters(prev => ({ ...prev, descriptionSearch: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Property Type Filter */}
              {uniquePropertyTypes.length > 1 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    Property Type
                  </label>
                  <MultiSelect
                    options={uniquePropertyTypes.map(type => ({ value: type, label: type }))}
                    selected={filters.property_type}
                    onChange={(selected) => setFilters(prev => ({ ...prev, property_type: selected }))}
                    placeholder="Select types..."
                  />
                </div>
              )}

              {/* Region Filter */}
              {uniqueRegions.length > 1 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Region
                  </label>
                  <MultiSelect
                    options={uniqueRegions.map(region => ({ value: region, label: region }))}
                    selected={filters.region}
                    onChange={(selected) => setFilters(prev => ({ ...prev, region: selected }))}
                    placeholder="Select regions..."
                  />
                </div>
              )}
            
              {/* Municipality Filter */}
              {uniqueMunicipalities.length > 1 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Municipality
                  </label>
                  <MultiSelect
                    options={uniqueMunicipalities.map(municipality => ({ value: municipality, label: municipality }))}
                    selected={filters.municipality}
                    onChange={(selected) => setFilters(prev => ({...prev, municipality: selected}))}
                    placeholder="Select municipalities..."
                  />
                </div>
              )}
              
              {/* Occupancy Filter */}
              {uniqueOccupancyStatuses.length > 1 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Occupancy
                  </label>
                  <MultiSelect
                    options={uniqueOccupancyStatuses.map(status => ({ value: status, label: status }))}
                    selected={filters.occupancy_status}
                    onChange={(selected) => setFilters(prev => ({...prev, occupancy_status: selected}))}
                    placeholder="Select statuses..."
                  />
                </div>
              )}
              
              {/* Price Range */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  Price Range
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.price.min}
                    onChange={(e) => setFilters(prev => ({...prev, price: { ...prev.price, min: e.target.value } }))}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.price.max}
                    onChange={(e) => setFilters(prev => ({...prev, price: { ...prev.price, max: e.target.value } }))}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Area Range */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  Area (m²)
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.property_area.min}
                    onChange={(e) => setFilters(prev => ({...prev, property_area: { ...prev.property_area, min: e.target.value } }))}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.property_area.max}
                    onChange={(e) => setFilters(prev => ({...prev, property_area: { ...prev.property_area, max: e.target.value } }))}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Price per m² Range */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  Price/m²
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.price_per_sqm.min}
                    onChange={(e) => setFilters(prev => ({...prev, price_per_sqm: { ...prev.price_per_sqm, min: e.target.value } }))}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.price_per_sqm.max}
                    onChange={(e) => setFilters(prev => ({...prev, price_per_sqm: { ...prev.price_per_sqm, max: e.target.value } }))}
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("aiLabel")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("simpleTag")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("code")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("partNumber")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("auctionDate")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("postDate")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("startingPrice")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("auctionObject")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("propertyType")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("address")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("area")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("pricePerSqm")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("occupancyStatus")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("description")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  {t("notes")}
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t("url")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedResults.map((item, idx) =>
                item.error ? (
                  <tr
                    key={idx}
                    className="bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <td
                      colSpan={17}
                      className="px-4 py-6 text-red-700 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{item.error}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50 transition-colors border-b border-gray-100"
                  >
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100 align-top">
                      <div className="flex flex-col gap-1">
                        {(item.ai_labels || []).map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-800"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      {item.simple_tag || "N/A"}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      {item.code || "N/A"}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      {item.part_number || "N/A"}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {item.date || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      {item.post_date || "N/A"}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r border-gray-100 align-top">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4 text-green-600" />
                        {formatPrice(item.price)}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {item.auction_object || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      {item.property_type || "N/A"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs border-r border-gray-100 align-top">
                      <div className="truncate" title={item.address}>
                        {item.address || "N/A"}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 text-center align-top">
                      <span className="font-medium">
                        {item.property_area ? `${item.property_area}` : "N/A"}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-700 border-r border-gray-100 align-top">
                      {item.price_per_sqm || "N/A"}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      {item.occupancy_status ? (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            item.occupancy_status === "Κατοικείται"
                              ? "bg-red-100 text-red-800"
                              : item.occupancy_status === "Ακατοίκητο"
                              ? "bg-green-100 text-green-800"
                              : item.occupancy_status === "Εκκενωμένο"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.occupancy_status}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 max-w-lg border-r border-gray-100 align-top">
                      <div
                        className="text-xs leading-relaxed"
                        title={item.property_description}
                      >
                        <p className="line-clamp-2">
                          {item.property_description || "N/A"}
                        </p>
                        {item.property_description && (
                          <button
                            onClick={() =>
                              setModalData({
                                title: t("propertyDescription"),
                                content: item.property_description,
                              })
                            }
                            className="text-blue-600 hover:underline text-xs mt-1 inline-flex items-center gap-1"
                          >
                            {t("readMore")} <BookText className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 max-w-lg border-r border-gray-100 align-top">
                      <div
                        className="text-xs leading-relaxed"
                        title={item.notes}
                      >
                        <p className="line-clamp-2">{item.notes || "N/A"}</p>
                        {item.notes && (
                          <button
                            onClick={() =>
                              setModalData({
                                title: t("notes"),
                                content: item.notes,
                              })
                            }
                            className="text-blue-600 hover:underline text-xs mt-1 inline-flex items-center gap-1"
                          >
                            {t("readMore")} <BookText className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      {item.all_pdf_links && item.all_pdf_links.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {item.all_pdf_links.map((pdfUrl, pdfIndex) => (
                            <a
                              key={pdfIndex}
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium transition-colors text-xs"
                              title={pdfUrl}
                            >
                              <FileText className="w-3 h-3" />
                              PDF {pdfIndex + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">{t('noPdfs')}</span>
                      )}
                    </td> */}

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 align-top">
                      {item.all_pdf_links && item.all_pdf_links.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {item.all_pdf_links.map((pdfUrl, pdfIndex) => (
                            <a
                              key={pdfIndex}
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium transition-colors text-xs"
                              title={pdfUrl}
                            >
                              <FileText className="w-3 h-3" />
                              PDF {pdfIndex + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {t("noPdfs")}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap align-top">
                      <a
                        href={item.detail_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        URL
                      </a>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
        {filteredResults.length > 0 ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          ) : (
            !resultArray.some((item) => item.error) && (
              <div className="w-full p-8 text-center">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("noResultsFound")}
                </h3>
                <p className="text-gray-500 mb-4">{t("tryAdjustingFilters")}</p>
                <button
                  onClick={clearPostFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t("clearAllFilters")}
                </button>
              </div>
            )
          )}
        </div>
      </div>

      <Dialog open={!!modalData} onOpenChange={() => setModalData(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalData?.title}</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <div className="prose max-w-none prose-sm py-4 max-h-[60vh] overflow-y-auto">
            {modalData?.content}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Table;
