import React from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  X as XIcon,
  Loader as LoaderIcon,
} from "lucide-react";
import region_municipality_map from "@/lib/region_municipality.json";

const Filters = ({
  conductFrom,
  setConductFrom,
  conductTo,
  setConductTo,
  postingFrom,
  setPostingFrom,
  postingTo,
  setPostingTo,
  sortBy,
  setSortBy,
  page,
  setPage,
  onScrape,
  isLoading,
  clearFilters,
  hasActiveFilters,
}) => {
  const [region, setRegion] = React.useState("Select All");
  const [municipality, setMunicipality] = React.useState("Select All");
  const [municipalities, setMunicipalities] = React.useState([]);
  const [propertyType, setPropertyType] = React.useState("Select All");

  // Build regions from mapping
  const regions = ["Select All", ...Object.keys(region_municipality_map)];

  const propertyTypes = [
    "Select All",
    "Residence", // subType=5
    "Other Commercial Property", // subType=6
    "Store", // subType=7
    "Office", // subType=8
    "Parking", // subType=9
    "Warehouse", // subType=10
    "Industrial Building", // subType=11
    "Plot", // subType=12
    "Plot with building", // subType=13
    "Land", // subType=14
    "Land with building", // subType=15
    "Hotels", // subType=16
  ];

  // Load municipalities when region changes
  React.useEffect(() => {
    if (region === "Select All") {
      setMunicipalities(["Select All"]);
      setMunicipality("Select All");
      return;
    }
    // Get municipalities from the JSON data
    try {
      const regionData = region_municipality_map[region];
      if (regionData && Array.isArray(regionData.municipalities)) {
        setMunicipalities([
          "Select All",
          ...regionData.municipalities.map((m) => m.name),
        ]);
      } else {
        setMunicipalities(["Select All"]);
      }
      setMunicipality("Select All");
    } catch (error) {
      console.error("Error loading municipalities:", error);
      setMunicipalities(["Select All"]);
      setMunicipality("Select All");
    }
  }, [region]);

  const handleScrape = () => {
    // Construct region parameter using region_value
    let regionParam = "";
    if (region !== "Select All") {
      const regionData = region_municipality_map[region];
      if (regionData && regionData.region_value) {
        regionParam = `&extendedFilter1=1,1,${regionData.region_value}`;
      }
    }

    // Construct property type parameter
    let propertyParam = "";
    if (propertyType !== "Select All") {
      const propertyIndex = propertyTypes.indexOf(propertyType);
      if (propertyIndex > 0) {
        const subTypeValue = propertyIndex + 4; // Start from 5 (5 = index 1 + 4)
        propertyParam = `&subType=${subTypeValue}`;
      }
    }

    // Construct municipality parameter using municipality value
    let municipalityParam = "";
    if (municipality !== "Select All" && region !== "Select All") {
      const regionData = region_municipality_map[region];
      if (regionData && Array.isArray(regionData.municipalities)) {
        const munObj = regionData.municipalities.find(
          (m) => m.name === municipality
        );
        if (munObj && munObj.value) {
          municipalityParam = `&extendedFilter2=1,2,${munObj.value}`;
        }
      }
    }

    // Call the onScrape function with all parameters
    if (onScrape) {
      onScrape({
        conductFrom,
        conductTo,
        postingFrom,
        postingTo,
        sortBy,
        page,
        regionParam,
        propertyParam,
        municipalityParam,
        selectedRegion: region,
        selectedMunicipality: municipality,
        selectedPropertyType: propertyType,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Search Filters
            </h2>
          </div>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="text-gray-600 hover:text-gray-800 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            >
              <XIcon className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Date of Conduct From */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Date of Conduct From
            </label>
            <div className="relative">
              <input
                type="date"
                value={conductFrom || ""}
                onChange={(e) => setConductFrom(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Date of Conduct To */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Date of Conduct To
            </label>
            <div className="relative">
              <input
                type="date"
                value={conductTo || ""}
                onChange={(e) => setConductTo(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Date of Posting From */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Date of Posting From
            </label>
            <div className="relative">
              <input
                type="date"
                value={postingFrom || ""}
                onChange={(e) => setPostingFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Date of Posting To */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Date of Posting To
            </label>
            <div className="relative">
              <input
                type="date"
                value={postingTo || ""}
                onChange={(e) => setPostingTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              <option value="priceAsc">Starting Price (ascending)</option>
              <option value="priceDesc">Starting Price (descending)</option>
              <option value="auctionDateAsc">Auction Date (ascending)</option>
              <option value="auctionDateDesc">Auction Date (descending)</option>
            </select>
          </div>

          {/* Page Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Number
            </label>
            <input
              type="number"
              min={1}
              value={page}
              onChange={(e) => setPage(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              {propertyTypes.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              {regions.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Municipality */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Municipality
            </label>
            <select
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              disabled={region === "Select All"}
            >
              {municipalities.map((m, idx) => (
                <option key={idx} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6">
        <Button
          onClick={handleScrape}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <LoaderIcon className="w-5 h-5 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <SearchIcon className="w-5 h-5" />
              Start Scraping
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Filters;
