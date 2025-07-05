import React from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  X as XIcon,
  Loader as LoaderIcon,
  Clock as ClockIcon,
} from "lucide-react";
import { useTranslation } from 'react-i18next';
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
  isScrapingDisabled,
  timeLeft,
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  // Build region options
  const regionOptions = [
    { label: t('selectAll'), value: 'Select All' },
    ...Object.entries(region_municipality_map).map(([regionKey, regionObj]) => ({
      label: language === 'el' ? regionKey : regionObj.region_name_en,
      value: regionKey // always Greek key for API
    }))
  ];

  // State for region and municipality
  const [region, setRegion] = React.useState('Select All');
  const [municipality, setMunicipality] = React.useState('Select All');
  const [municipalities, setMunicipalities] = React.useState([]);
  const [propertyType, setPropertyType] = React.useState('Select All');

  // Update municipalities when region changes
  React.useEffect(() => {
    if (region === 'Select All') {
      setMunicipalities([{ label: t('selectAll'), value: 'Select All' }]);
      setMunicipality('Select All');
      return;
    }
    try {
      const regionData = region_municipality_map[region];
      if (regionData && Array.isArray(regionData.municipalities)) {
        setMunicipalities([
          { label: t('selectAll'), value: 'Select All' },
          ...regionData.municipalities.map((m) => ({
            label: language === 'el' ? m.name_gr : m.name_en,
            value: m.name_gr // always Greek for API
          }))
        ]);
      } else {
        setMunicipalities([{ label: t('selectAll'), value: 'Select All' }]);
      }
      setMunicipality('Select All');
    } catch (error) {
      console.error("Error loading municipalities:", error);
      setMunicipalities([{ label: t('selectAll'), value: 'Select All' }]);
      setMunicipality('Select All');
    }
  }, [region, t, language]);

  const propertyTypes = [
    t('selectAll'),
    t('residence'), // subType=5
    t('otherCommercialProperty'), // subType=6
    t('store'), // subType=7
    t('office'), // subType=8
    t('parking'), // subType=9
    t('warehouse'), // subType=10
    t('industrialBuilding'), // subType=11
    t('plot'), // subType=12
    t('plotWithBuilding'), // subType=13
    t('land'), // subType=14
    t('landWithBuilding'), // subType=15
    t('hotels'), // subType=16
  ];

  const handleScrape = () => {
    // Prevent multiple clicks
    if (isLoading || isScrapingDisabled) {
      return;
    }

    // Construct region parameter using region_value
    let regionParam = "";
    if (region !== 'Select All') {
      const regionData = region_municipality_map[region];
      if (regionData && regionData.region_value) {
        regionParam = `&extendedFilter1=1,1,${regionData.region_value}`;
      }
    }

    // Construct property type parameter
    let propertyParam = "";
    if (propertyType !== t('selectAll')) {
      const propertyIndex = propertyTypes.indexOf(propertyType);
      if (propertyIndex > 0) {
        const subTypeValue = propertyIndex + 4; // Start from 5 (5 = index 1 + 4)
        propertyParam = `&subType=${subTypeValue}`;
      }
    }

    // Construct municipality parameter using municipality value
    let municipalityParam = "";
    if (municipality !== 'Select All' && region !== 'Select All') {
      const regionData = region_municipality_map[region];
      if (regionData && Array.isArray(regionData.municipalities)) {
        const munObj = regionData.municipalities.find(
          (m) => m.name_gr === municipality
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

  // Get button text and icon based on state
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <LoaderIcon className="w-5 h-5 animate-spin" />
          {t('scraping')}
        </>
      );
    }
    
    if (isScrapingDisabled && timeLeft) {
      return (
        <>
          <ClockIcon className="w-5 h-5" />
          {t('waitBeforeNextScrape', { timeLeft })}
        </>
      );
    }
    
    return (
      <>
        <SearchIcon className="w-5 h-5" />
        {t('startScraping')}
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {t('searchFilters')}
            </h2>
          </div>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="text-gray-600 hover:text-gray-800 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            >
              <XIcon className="w-4 h-4" />
              {t('clearFilters')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Date of Conduct From */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              {t('dateOfConductFrom')}
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
              {t('dateOfConductTo')}
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
              {t('dateOfPostingFrom')}
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
              {t('dateOfPostingTo')}
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
              {t('sortBy')}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              <option value="priceAsc">{t('startingPriceAsc')}</option>
              <option value="priceDesc">{t('startingPriceDesc')}</option>
              <option value="auctionDateAsc">{t('auctionDateAsc')}</option>
              <option value="auctionDateDesc">{t('auctionDateDesc')}</option>
            </select>
          </div>

          {/* Page Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('pageNumber')}
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
              {t('propertyType')}
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
              {t('region')}
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              {regionOptions.map((r, idx) => (
                <option key={idx} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Municipality */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('municipality')}
            </label>
            <select
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              disabled={region === 'Select All'}
            >
              {municipalities.map((m, idx) => (
                <option key={idx} value={m.value}>
                  {m.label}
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
          disabled={isScrapingDisabled}
          className={`px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
            isScrapingDisabled 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title={isScrapingDisabled && timeLeft ? t('waitBeforeNextScrape', { timeLeft }) : ''}
        >
          {getButtonContent()}
        </Button>
      </div>
    </div>
  );
};

export default Filters;
