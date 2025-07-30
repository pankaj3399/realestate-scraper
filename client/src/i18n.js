import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// English translations
const enTranslations = {
  translation: {
    // Header
    auctionScraperDashboard: "Auction Scraper Dashboard",
    configureFiltersAndScrape:
      "Configure filters and scrape auction data with advanced search capabilities",
    auctionResults: "Auction Results",

    // Filters
    searchFilters: "Search Filters",
    clearFilters: "Clear Filters",
    dateOfConductFrom: "Date of Conduct From",
    dateOfConductTo: "Date of Conduct To",
    dateOfPostingFrom: "Date of Posting From",
    dateOfPostingTo: "Date of Posting To",
    sortBy: "Sort By",
    pageNumber: "Page Number",
    propertyType: "Property Type",
    region: "Region",
    municipality: "Municipality",
    selectAll: "Select All",
    occupancy: "Occupancy",
    priceRange: "Price Range",
    minPrice: "Min €",
    maxPrice: "Max €",
    allTypes: "All Types",
    allRegions: "All Regions",
    allMunicipalities: "All Municipalities",
    allStatus: "All Status",
    startPage: "Start Page",
    endPage: "End Page",

    // Sort options
    startingPriceAsc: "Starting Price (ascending)",
    startingPriceDesc: "Starting Price (descending)",
    auctionDateAsc: "Auction Date (ascending)",
    auctionDateDesc: "Auction Date (descending)",

    // Property types
    residence: "Residence",
    otherCommercialProperty: "Other Commercial Property",
    store: "Store",
    office: "Office",
    parking: "Parking",
    warehouse: "Warehouse",
    industrialBuilding: "Industrial Building",
    plot: "Plot",
    plotWithBuilding: "Plot with building",
    land: "Land",
    landWithBuilding: "Land with building",
    hotels: "Hotels",

    // Actions
    startScraping: "Start Scraping",
    scraping: "Scraping...",
    scrapingInProgress: "Scraping in progress...",
    scrapingComplete: "Scraping complete!",
    errorDuringScraping: "Error during scraping.",

    // Status messages
    waitBeforeNextScrape: "Please wait {{timeLeft}} before next scrape",
    captchaProtection: "CAPTCHA protection active",
    cooldownActive: "Cooldown period active",

    // Language selector
    language: "Language",
    english: "English",
    greek: "Greek",

    // Table headers
    status: "Status",
    price: "Price",
    date: "Date",
    debtor: "Debtor",
    kind: "Kind",
    region: "Region",
    municipality: "Municipality",
    detailLink: "Detail Link",
    aiLabel: "AI Label",
    simpleTag: "Simple Tag",
    code: "Code",
    partNumber: "Part #",
    advancedFilters: "Advanced Filters",
    auctionDate: "Auction Date",
    postDate: "Post Date",
    startingPrice: "Starting Price",
    auctionObject: "Auction Object",
    address: "Address",
    area: "Area (m²)",
    pricePerSqm: "Price per m²",
    occupancyStatus: "Occupancy",
    description: "Description",
    notes: "Notes",
    url: "URL",
    noPdfs: "No PDFs",
    readMore: "Read more",
    propertyDescription: "Property Description",

    // Pagination
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    results: "results",
    showing: "Showing",

    // Export
    exportToCSV: "Export to CSV",
    exportToExcel: "Export to Excel",
    clearResults: "Clear Results",

    // Errors
    noResults: "No results found.",
    noResultsFound: "No Results Found",
    tryAdjustingFilters: "Try adjusting your filters to see more results.",
    clearAllFilters: "Clear All Filters",
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    noDataFetched: "No Data Fetched",
    startScrapeToSeeResults: "Start a scrape to see results here.",
  },
};

// Greek translations
const elTranslations = {
  translation: {
    // Header
    auctionScraperDashboard: "Πίνακας Ελέγχου Scraper Δημοπρασιών",
    configureFiltersAndScrape:
      "Ρυθμίστε τα φίλτρα και κάντε scrape δεδομένα δημοπρασιών με προηγμένες δυνατότητες αναζήτησης",
    auctionResults: "Αποτελέσματα Δημοπρασιών",

    // Filters
    searchFilters: "Φίλτρα Αναζήτησης",
    clearFilters: "Καθαρισμός Φίλτρων",
    dateOfConductFrom: "Ημερομηνία Διεξαγωγής Από",
    dateOfConductTo: "Ημερομηνία Διεξαγωγής Έως",
    dateOfPostingFrom: "Ημερομηνία Δημοσίευσης Από",
    dateOfPostingTo: "Ημερομηνία Δημοσίευσης Έως",
    sortBy: "Ταξινόμηση Κατά",
    pageNumber: "Αριθμός Σελίδας",
    propertyType: "Τύπος Ακινήτου",
    region: "Περιφέρεια",
    municipality: "Δήμος",
    selectAll: "Επιλογή Όλων",
    occupancy: "Κατοχή",
    priceRange: "Εύρος Τιμής",
    minPrice: "Ελάχ. €",
    maxPrice: "Μέγ. €",
    allTypes: "Όλοι οι Τύποι",
    allRegions: "Όλες οι Περιφέρειες",
    allMunicipalities: "Όλοι οι Δήμοι",
    allStatus: "Όλες οι Καταστάσεις",
    startPage: "Αρχική Σελίδα",
    endPage: "Τελική Σελίδα",

    // Sort options
    startingPriceAsc: "Τιμή Έναρξης (αύξουσα)",
    startingPriceDesc: "Τιμή Έναρξης (φθίνουσα)",
    auctionDateAsc: "Ημερομηνία Δημοπρασίας (αύξουσα)",
    auctionDateDesc: "Ημερομηνία Δημοπρασίας (φθίνουσα)",

    // // Property types
    // residence: "Κατοικία",
    // otherCommercialProperty: "Άλλη Εμπορική Ιδιοκτησία",
    // store: "Κατάστημα",
    // office: "Γραφείο",
    // parking: "Χώρος Στάθμευσης",
    // warehouse: "Αποθήκη",
    // industrialBuilding: "Βιομηχανικό Κτίριο",
    // plot: "Οικόπεδο",
    // plotWithBuilding: "Οικόπεδο με κτίριο",
    // land: "Γη",
    // landWithBuilding: "Γη με κτίριο",
    // hotels: "Ξενοδοχεία",

    // Property types
    residence: "Κατοικία",
    otherCommercialProperty: "Άλλος Επαγγελματικός Χώρος",
    store: "Κατάστημα",
    office: "Γραφείο",
    parking: "Θέση Στάθμευσης (parking)",
    warehouse: "Αποθήκη",
    industrialBuilding: "Βιομηχανικός / Βιοτεχνικός Χώρος",
    plot: "Οικόπεδο",
    plotWithBuilding: "Οικόπεδο με κτίσμα",
    land: "Αγροτεμάχιο",
    landWithBuilding: "Αγροτεμάχιο με κτίσμα",
    hotels: "Ξενοδοχειακή Μονάδα",

    // Actions
    startScraping: "Έναρξη Scraping",
    scraping: "Scraping...",
    scrapingInProgress: "Scraping σε εξέλιξη...",
    scrapingComplete: "Scraping ολοκληρώθηκε!",
    errorDuringScraping: "Σφάλμα κατά το scraping.",

    // Status messages
    waitBeforeNextScrape:
      "Παρακαλώ περιμένετε {{timeLeft}} πριν από το επόμενο scrape",
    captchaProtection: "Προστασία CAPTCHA ενεργή",
    cooldownActive: "Ενεργή περίοδος αναμονής",

    // Language selector
    language: "Γλώσσα",
    english: "Αγγλικά",
    greek: "Ελληνικά",

    // Table headers
    status: "Κατάσταση",
    price: "Τιμή",
    date: "Ημερομηνία",
    debtor: "Οφειλέτης",
    kind: "Είδος",
    region: "Περιφέρεια",
    municipality: "Δήμος",
    detailLink: "Σύνδεσμος Λεπτομερειών",
    aiLabel: "Ετικέτα AI",
    simpleTag: "Απλή ετικέτα",
    code: "Κωδικός",
    partNumber: "Αρ. μέρους",
    advancedFilters: "Προηγμένα Φίλτρα",
    auctionDate: "Ημερομηνία Δημοπρασίας",
    postDate: "Ημερομηνία Δημοσίευσης",
    startingPrice: "Τιμή Έναρξης",
    auctionObject: "Αντικείμενο Δημοπρασίας",
    address: "Διεύθυνση",
    area: "Επιφάνεια (m²)",
    pricePerSqm: "Τιμή ανά m²",
    occupancyStatus: "Κατοχή",
    description: "Περιγραφή",
    notes: "Σημειώσεις",
    url: "URL",
    noPdfs: "Δεν υπάρχουν PDF",
    readMore: "Διαβάστε περισσότερα",
    propertyDescription: "Περιγραφή Ακινήτου",

    // Pagination
    previous: "Προηγούμενη",
    next: "Επόμενη",
    page: "Σελίδα",
    of: "από",
    results: "αποτελέσματα",
    showing: "Εμφάνιση",

    // Export
    exportToCSV: "Εξαγωγή σε CSV",
    exportToExcel: "Εξαγωγή σε Excel",
    clearResults: "Καθαρισμός Αποτελεσμάτων",

    // Errors
    noResults: "Δεν βρέθηκαν αποτελέσματα.",
    noResultsFound: "Δεν Βρέθηκαν Αποτελέσματα",
    tryAdjustingFilters:
      "Δοκιμάστε να προσαρμόσετε τα φίλτρα σας για να δείτε περισσότερα αποτελέσματα.",
    clearAllFilters: "Καθαρισμός Όλων των Φίλτρων",
    loading: "Φόρτωση...",
    error: "Σφάλμα",
    retry: "Επανάληψη",
    noDataFetched: "Δεν Έχουν Ληφθεί Δεδομένα",
    startScrapeToSeeResults: "Ξεκινήστε ένα scrape για να δείτε εδώ τα αποτελέσματα.",
  },
};

i18n.use(initReactI18next).init({
  resources: {
    en: enTranslations,
    el: elTranslations,
  },
  lng: "en", // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
