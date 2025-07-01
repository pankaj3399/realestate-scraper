import React, { useState, useMemo } from "react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
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
} from "lucide-react";

const Table = ({ results = { results: [], total_results: 0 }, page, onPageChange, hasSearched }) => {
  const resultArray = Array.isArray(results.results) ? results.results : [];
  const totalResults = results.total_results || 0;
  // Post-scraping filter states
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [occupancyFilter, setOccupancyFilter] = useState("");

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

    console.log(resultArray);

    return resultArray.filter((item) => {
      // Skip error items in filtering
      if (item.error) return true;

      // Property Type filter
      if (propertyTypeFilter && item.kind !== propertyTypeFilter) return false;

      // Region filter
      if (regionFilter && item.region !== regionFilter) return false;

      // Municipality filter
      if (municipalityFilter && item.municipality !== municipalityFilter)
        return false;

      // Occupancy filter
      if (occupancyFilter && item.occupancy_status !== occupancyFilter)
        return false;

      // Price filter
      const numericPrice = getNumericPrice(item.price);
      if (priceFilter.min && numericPrice < parseFloat(priceFilter.min))
        return false;
      if (priceFilter.max && numericPrice > parseFloat(priceFilter.max))
        return false;

      return true;
    });
  }, [
    resultArray,
    propertyTypeFilter,
    regionFilter,
    municipalityFilter,
    priceFilter,
    occupancyFilter,
  ]);

  // Headers for CSV/Excel export
  const headers = [
    { label: "AI Label", key: "ai_labels" },
    { label: "Simple Tag", key: "simple_tag" },
    { label: "Code", key: "code" },
    { label: "Part #", key: "part_number" },
    { label: "Auction Date", key: "date" },
    { label: "Post Date", key: "post_date" },
    { label: "Starting Price", key: "price" },
    { label: "Auction Object", key: "auction_object" },
    { label: "Property Type", key: "property_type" },
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
    const municipalities = regionFilter
      ? resultArray
          .filter((item) => item && item.region === regionFilter) // Add safety check
          .map((item) => item.municipality)
          .filter((municipality) => municipality && municipality !== "N/A")
      : resultArray
          .filter((item) => item && item.municipality) // Add safety check
          .map((item) => item.municipality)
          .filter((municipality) => municipality && municipality !== "N/A");

    return [...new Set(municipalities)].sort();
  }, [resultArray, regionFilter]);

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
    setPropertyTypeFilter("");
    setRegionFilter("");
    setMunicipalityFilter("");
    setPriceFilter({ min: "", max: "" });
    setOccupancyFilter("");
  };

  const hasActiveFilters =
    propertyTypeFilter ||
    regionFilter ||
    municipalityFilter ||
    priceFilter.min ||
    priceFilter.max ||
    occupancyFilter;

  // Pagination logic
  const resultsPerPage = 20;
  const totalPages = Math.max(
    1,
    Math.ceil((totalResults || resultArray.length) / resultsPerPage)
  );

  console.log(totalResults)

  if (hasSearched && (!Array.isArray(resultArray) || resultArray.length === 0)) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results</h3>
        <p className="text-gray-500">No auction data available to display.</p>
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
                  Auction Results
                </h2>
                <p className="text-sm text-gray-600">
                  Showing {filteredResults.length} of {resultArray.length} auctions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CSVLink
                data={exportData}
                headers={headers}
                filename={"AuctionResults.csv"}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                CSV
              </CSVLink>
              <button
                onClick={handleExcelExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearPostFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Home className="w-4 h-4" />
                Property Type
              </label>
              <select
                value={propertyTypeFilter}
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm shadow-sm"
              >
                <option value="">All Types</option>
                {uniquePropertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Region
              </label>
              <select
                value={regionFilter}
                onChange={(e) => {
                  setRegionFilter(e.target.value);
                  setMunicipalityFilter(""); // Reset municipality when region changes
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm shadow-sm"
              >
                <option value="">All Regions</option>
                {uniqueRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Municipality
              </label>
              <select
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm shadow-sm"
              >
                <option value="">All Municipalities</option>
                {uniqueMunicipalities.map((municipality) => (
                  <option key={municipality} value={municipality}>
                    {municipality}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <User className="w-4 h-4" />
                Occupancy
              </label>
              <select
                value={occupancyFilter}
                onChange={(e) => setOccupancyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm shadow-sm"
              >
                <option value="">All Status</option>
                {uniqueOccupancyStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Euro className="w-4 h-4" />
                Price Range
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={priceFilter.min}
                  onChange={(e) =>
                    setPriceFilter((prev) => ({ ...prev, min: e.target.value }))
                  }
                  placeholder="Min €"
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm shadow-sm"
                />
                <input
                  type="number"
                  value={priceFilter.max}
                  onChange={(e) =>
                    setPriceFilter((prev) => ({ ...prev, max: e.target.value }))
                  }
                  placeholder="Max €"
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm shadow-sm"
                />
              </div>
            </div>
          </div> */}
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  AI Label
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Simple Tag
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Code
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Part #
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Auction Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Post Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Starting Price
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Auction Object
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Property Type
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Address
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Area (m²)
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Price per m²
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Occupancy
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Description
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Notes
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  URL
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((item, idx) =>
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
                                title: "Property Description",
                                content: item.property_description,
                              })
                            }
                            className="text-blue-600 hover:underline text-xs mt-1 inline-flex items-center gap-1"
                          >
                            Read more <BookText className="w-3 h-3" />
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
                                title: "Notes",
                                content: item.notes,
                              })
                            }
                            className="text-blue-600 hover:underline text-xs mt-1 inline-flex items-center gap-1"
                          >
                            Read more <BookText className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

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
                        <span className="text-gray-400 text-xs">No PDFs</span>
                      )}
                    </td>

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
                        <span className="text-gray-400 text-xs">No PDFs</span>
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

        {/* Footer */}
        {filteredResults.length === 0 &&
          !resultArray.some((item) => item.error) && (
            <div className="p-8 text-center bg-gray-50">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Results Found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters to see more results.
              </p>
              <button
                onClick={clearPostFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 my-6">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded border bg-white disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded border bg-white disabled:opacity-50"
        >
          Next
        </button>
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
