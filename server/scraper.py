from playwright.sync_api import sync_playwright
from datetime import datetime
import requests
import PyPDF2
import io
import google.generativeai as genai
import os
import random
import time
import json
import re
from dotenv import dotenv_values

# BYPASS_HUMAN_BEHAVIOR: If True, all delays and human-like waits are skipped
BYPASS_HUMAN_BEHAVIOR = False  # Set to True to skip all waits and scraping is instant
config = dotenv_values()  # Load .env file into a dictionary
print(BYPASS_HUMAN_BEHAVIOR)

def format_date(date_str):
    """Convert YYYY-MM-DD to DD/MM/YYYY format"""
    if not date_str:
        return None
    try:
        year, month, day = date_str.split("-")
        return f"{day}/{month}/{year}"
    except:
        return None


def get_current_date_formatted():
    """Get current date in DD/MM/YYYY format"""
    return datetime.now().strftime("%d/%m/%Y")


def construct_url(params):
    """Construct URL with specific parameter order and format"""
    base_url = "https://www.eauction.gr/Home/HlektronikoiPleistiriasmoi"

    # Define the order of parameters
    ordered_params = []

    # First add conductFrom
    if params.get('conductFrom'):
        ordered_params.append(f"conductFrom={params['conductFrom']}")

    ordered_params.append("type=1")

    # Then add sort parameters if present
    if "sortAsc" in params and "sortId" in params:
        ordered_params.append(f"sortAsc={str(params['sortAsc']).lower()}")
        ordered_params.append(f"sortId={params['sortId']}")

    # Add other date parameters if present
    if params.get('conductTo'):
        ordered_params.append(f"conductTo={params['conductTo']}")
    if params.get('postFrom'):
        ordered_params.append(f"postFrom={params['postFrom']}")
    if params.get('postTo'):
        ordered_params.append(f"postTo={params['postTo']}")

    # Add property type parameter (subType)
    if params.get('propertyParam'):
        # Extract subType value from propertyParam like "&subType=5"
        property_param = params['propertyParam'].strip()
        if property_param.startswith('&'):
            property_param = property_param[1:]  # Remove leading &
        ordered_params.append(property_param)

    # Add region parameter (extendedFilter1)
    if params.get('regionParam'):
        region_param = params['regionParam'].strip()
        if region_param.startswith('&'):
            region_param = region_param[1:]  # Remove leading &
        ordered_params.append(region_param)

    # Add municipality parameter (extendedFilter2)
    if params.get('municipalityParam'):
        municipality_param = params['municipalityParam'].strip()
        if municipality_param.startswith('&'):
            municipality_param = municipality_param[1:]  # Remove leading &
        ordered_params.append(municipality_param)

    # Always add these at the end
    ordered_params.append("conductedSubTypeId=1")
    
    # Use the page parameter if present, otherwise default to 1
    page_num = params.get("page", 1)
    ordered_params.append(f"page={page_num}")

    final_url = f"{base_url}?{'&'.join(ordered_params)}"
    print(f"Final constructed URL: {final_url}")
    return final_url


def parse_greek_number(number_str):
    """Parse Greek-formatted numbers to float.
    Greek format: 94.000,00 € (period for thousands, comma for decimal)
    English format needs: 94000.00
    """
    if not number_str or number_str == "N/A":
        return None

    try:
        # Clean the string
        cleaned = str(number_str).strip()

        # Remove currency symbols and extra spaces
        cleaned = cleaned.replace("€", "").replace("EUR", "").replace("$", "").strip()

        # Handle Greek number format
        if "," in cleaned and "." in cleaned:
            # Greek format: 94.000,50 (periods for thousands, comma for decimal)
            parts = cleaned.split(",")
            if len(parts) == 2:
                # Replace periods in the integer part (thousands separators)
                integer_part = parts[0].replace(".", "")
                decimal_part = parts[1]
                cleaned = f"{integer_part}.{decimal_part}"
        elif "," in cleaned and "." not in cleaned:
            # Only comma (decimal separator): 94,50
            cleaned = cleaned.replace(",", ".")
        elif "." in cleaned and "," not in cleaned:
            # Check if it's thousands separator or decimal
            parts = cleaned.split(".")
            if len(parts) > 2:
                # Multiple periods = thousands separators: 1.234.567
                cleaned = cleaned.replace(".", "")
            elif len(parts) == 2 and len(parts[1]) == 3:
                # Likely thousands separator: 94.000
                cleaned = cleaned.replace(".", "")
            # If decimal part has 1-2 digits, keep as decimal: 94.5 or 94.50

        return float(cleaned)
    except (ValueError, AttributeError):
        return None


def get_random_user_agent():
    """Return a random user agent string"""
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    ]
    return random.choice(user_agents)


def human_like_delay(min_seconds=0.5, max_seconds=2):
    """Sleep for a random amount of time to simulate human behavior, unless bypassed"""
    if BYPASS_HUMAN_BEHAVIOR:
        return
    delay = random.uniform(min_seconds, max_seconds)
    print(f"Waiting {delay:.2f} seconds...")
    time.sleep(delay)


def simulate_human_scrolling(page):
    """Simulate human-like scrolling behavior, unless bypassed"""
    if BYPASS_HUMAN_BEHAVIOR:
        return
    try:
        # Random scroll down
        scroll_distance = random.randint(200, 600)
        page.evaluate(f"window.scrollBy(0, {scroll_distance})")
        time.sleep(random.uniform(0.2, 0.5))

        # Sometimes scroll back up a bit
        if random.random() < 0.3:
            scroll_back = random.randint(100, 300)
            page.evaluate(f"window.scrollBy(0, -{scroll_back})")
            time.sleep(random.uniform(0.2, 0.4))
    except Exception as e:
        print(f"Error during scrolling simulation: {e}")


def simulate_mouse_movement(page):
    """Simulate random mouse movements, unless bypassed"""
    if BYPASS_HUMAN_BEHAVIOR:
        return
    try:
        # Move mouse to random positions
        for _ in range(random.randint(1, 2)):  # Reduced from 1-3 to 1-2
            x = random.randint(100, 800)
            y = random.randint(100, 600)
            page.mouse.move(x, y)
            time.sleep(random.uniform(0.05, 0.15))  # Reduced from 0.1-0.3
    except Exception as e:
        print(f"Error during mouse movement simulation: {e}")


def scrape_auctions(
    conduct_from=None,
    conduct_to=None,
    posting_from=None,
    posting_to=None,
    sort_by="auctionDateAsc",
    regionParam=None,
    propertyParam=None,
    municipalityParam=None,
    selectedRegion=None,
    selectedMunicipality=None,
    selectedPropertyType=None,
    page=1
):
    # Configure Gemini at the start
    gemini_model = configure_gemini()

    results = []

    # Print startPage and endPage for debugging
    print(f"Received page: {page}")

    # Prepare parameters
    params = {
        "conductFrom": (
            format_date(conduct_from) if conduct_from else get_current_date_formatted()
        ),
        "page": page,
    }

    # Add other date filters if provided
    if conduct_to:
        params["conductTo"] = format_date(conduct_to)
    if posting_from:
        params["postFrom"] = format_date(posting_from)
    if posting_to:
        params["postTo"] = format_date(posting_to)

    print(f"\nReceived parameters:")
    print(f"- sort_by: {sort_by}")
    print(f"- regionParam: {regionParam}")
    print(f"- propertyParam: {propertyParam}")
    print(f"- municipalityParam: {municipalityParam}")
    print(f"- selectedRegion: {selectedRegion}")
    print(f"- selectedMunicipality: {selectedMunicipality}")
    print(f"- selectedPropertyType: {selectedPropertyType}")

    # Handle sorting
    if sort_by:
        if sort_by in ["auctionDateAsc", "auctionDateDesc"]:
            print("Setting auction date sort")
            params["sortId"] = 1
            params["sortAsc"] = sort_by == "auctionDateAsc"
        elif sort_by in ["priceAsc", "priceDesc"]:
            print("Setting price sort")
            params["sortId"] = 2
            params["sortAsc"] = sort_by == "priceAsc"
        else:
            print(f"Unknown sort_by value: {sort_by}")

    print(
        f"Final sort parameters: sortId={params.get('sortId')}, sortAsc={params.get('sortAsc')}"
    )

    # Add region/property/municipality params if present
    if regionParam:
        params["regionParam"] = regionParam
    if propertyParam:
        params["propertyParam"] = propertyParam
    if municipalityParam:
        params["municipalityParam"] = municipalityParam

    # Construct URL with specific format
    url = construct_url(params)
    print(f"Generated URL: {url}")

    with sync_playwright() as p:
        # Launch browser with more realistic settings
        browser = p.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--disable-extensions",
                "--no-sandbox",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor",
            ],
        )

        # Create context with random user agent
        context = browser.new_context(
            user_agent=get_random_user_agent(),
            viewport={
                "width": random.randint(1200, 1920),
                "height": random.randint(800, 1080),
            },
            locale="en-US",
            timezone_id="Europe/Athens",
        )

        # Remove webdriver property
        context.add_init_script(
            """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        """
        )

        p_page = context.new_page()

        total_results = 0
        try:
            print("Loading main auction page...")
            p_page.goto(url, timeout=60000)

            # Extract total results count
            try:
                # Wait for the element to be available before reading it
                total_text_selector = ".AuctionsListSearchOrderingTbl .AuctionsList-resultstxt"
                print(f"Waiting for selector: {total_text_selector}")
                total_text_elem = p_page.wait_for_selector(total_text_selector, timeout=15000) # Wait up to 15s
                
                total_text = total_text_elem.inner_text().strip()
                print(f"Raw text for total results: '{total_text}'")

                match = re.search(r"\d+", total_text)
                if match:
                    total_results = int(match.group())
                else:
                    total_results = 0
                print(f"Total results found: {total_results}")

            except Exception as e:
                print(f"Could not extract total results: {e}")
                total_results = 0
                
                print(total_results,"THIS IS TOTAL RESULTS")

            # Calculate total pages (20 auctions per page)
            total_pages = (total_results + 19) // 20 if total_results > 0 else 1
            print(f"Total pages: {total_pages}")

            # Validate the requested page
            if page < 1 or page > total_pages:
                error_msg = f"Requested page {page} is not valid. Total pages available: {total_pages}."
                print(error_msg)
                return {"results": [], "total_results": total_results, "error": error_msg}

            # Initial human-like delay
            human_like_delay(1.2, 2.6)

            # Simulate human behavior on main page
            simulate_human_scrolling(p_page)
            simulate_mouse_movement(p_page)

            # Wait for content to load
            p_page.wait_for_timeout(random.randint(800, 1500))

            auctions = p_page.query_selector_all("div.AList-BoxContainer")
            print(f"Found {len(auctions)} auctions to process")

            for idx, auction in enumerate(auctions):
                print(f"\nProcessing auction #{idx+1}/{len(auctions)}")

                try:
                    # Add delay between each auction processing
                    if idx > 0:  # Don't delay before first auction
                        human_like_delay(0.8, 2.2)

                    date_element = auction.query_selector(
                        "div.AList-BoxMainCell2 .DateIcon"
                    )
                    conduct_date = (
                        date_element.inner_text().strip() if date_element else "N/A"
                    )

                    auction.wait_for_selector(
                        "div.AList-BoxMainCell3 .AList-BoxTextBlueBold", timeout=3000
                    )
                    debtor_element = auction.query_selector(
                        "div.AList-BoxMainCell3 .AList-BoxTextBlueBold"
                    )
                    debtor = (
                        debtor_element.inner_text().strip() if debtor_element else "N/A"
                    )

                    auction.wait_for_selector(
                        "div.AList-BoxMainCell4 .AList-BoxTextBlueBold", timeout=3000
                    )
                    kind_element = auction.query_selector(
                        "div.AList-BoxMainCell4 .AList-BoxTextBlueBold"
                    )
                    kind_with_property = (
                        kind_element.inner_text().strip() if kind_element else "N/A"
                    )
                    kind = kind_with_property.replace("Ακίνητο -", "").strip()

                    region_element = auction.query_selector(
                        "div.AList-BoxMainCell4 .AList-BoxTextBlue"
                    )
                    region = "N/A"
                    municipality = "N/A"
                    if region_element:
                        text = region_element.inner_text().strip()
                        lines = text.split("\n")
                        for line in lines:
                            if "Περιφέρεια:" in line:
                                region = line.replace("Περιφέρεια:", "").strip()
                            elif "Δήμος:" in line:
                                municipality = line.replace("Δήμος:", "").strip()

                    auction.wait_for_selector(
                        "div.AList-Boxheader .AList-BoxheaderRight .AList-BoxTextPrice",
                        timeout=3000,
                    )
                    price_element = auction.query_selector(
                        "div.AList-Boxheader .AList-BoxheaderRight .AList-BoxTextPrice"
                    )
                    price = (
                        price_element.inner_text().strip() if price_element else "N/A"
                    )

                    auction.wait_for_selector(
                        "div.AList-Boxheader .AList-BoxheaderLeft .AList-BoxTextBlueBold",
                        timeout=3000,
                    )
                    status_element = auction.query_selector(
                        "div.AList-Boxheader .AList-BoxheaderLeft .AList-BoxTextBlueBold"
                    )
                    status = (
                        status_element.inner_text().strip() if status_element else "N/A"
                    )

                    auction.wait_for_selector(
                        "div.AList-Boxheader .AList-BoxheaderLeft .AList-BoxTextBlueBold",
                        timeout=3000,
                    )

                    auction.wait_for_selector(
                        "div.AList-BoxFooter .AList-BoxFooterLeft .AList-BoxTextBlue500"
                    )

                    elements = auction.query_selector_all(
                        "div.AList-BoxFooter .AList-BoxFooterLeft .AList-BoxTextBlue500"
                    )

                    postDate = (
                        elements[0].inner_text().strip() if len(elements) > 0 else "N/A"
                    )
                    uniqueCode = (
                        elements[1].inner_text().strip() if len(elements) > 1 else "N/A"
                    )

                    bold_element = auction.query_selector(
                        "div.AList-BoxFooter .AList-BoxFooterLeft b"
                    )
                    partLabel = (
                        bold_element.inner_text().strip() if bold_element else "N/A"
                    )

                    link_element = auction.query_selector("a")

                    print(f"Basic info: {kind}, {region}, {municipality}")

                    detail_link = "N/A"
                    auction_code = "N/A"
                    if link_element:
                        href = link_element.get_attribute("href")
                        if href:
                            if href.startswith("http"):
                                detail_link = href
                            else:
                                detail_link = "https://www.eauction.gr" + href

                            # Extract code from href like '/Auction/Details/123456'
                            try:
                                # Ensure we are splitting a string and it has enough parts
                                href_parts = href.split("/")
                                if len(href_parts) > 1:
                                    auction_code = href_parts[-1]
                            except Exception:
                                auction_code = "N/A"

                    # Scrape detail page info with enhanced human behavior
                    detail_info = None
                    duration = None
                    pdf_href = None
                    all_pdf_links = []
                    pdf_analysis = {}  # Use a dict for structured data

                    if detail_link != "N/A":
                        try:
                            print(f"Opening detail page for auction #{idx+1}")

                            # Create new page for detail
                            detail_page = context.new_page()

                            # Human-like delay before opening detail page
                            human_like_delay(0.9, 1.8)

                            detail_page.goto(detail_link, timeout=60000)

                            # Simulate human behavior on detail page
                            detail_page.wait_for_timeout(random.randint(500, 1000))
                            simulate_human_scrolling(detail_page)
                            simulate_mouse_movement(detail_page)

                            # Extract ALL PDF hrefs with delay
                            time.sleep(random.uniform(0.2, 0.5))
                            pdf_anchors = detail_page.query_selector_all(
                                "div.AuctionDetailsPDFItem .AuctionDetailsPDFtext .DownloadAuctionFile"
                            )
                            all_pdf_links = []
                            pdf_href_for_analysis = None
                            if pdf_anchors:
                                print(f"Found {len(pdf_anchors)} PDF anchor(s) for auction #{idx+1}")
                                print(pdf_anchors,"these are pdfs")
                                for i, pdf_anchor in enumerate(pdf_anchors):
                                    pdf_href = pdf_anchor.get_attribute("href")
                                    pdf_title = pdf_anchor.get_attribute("title")
                                    if pdf_href:
                                        full_pdf_url = (
                                            f"https://www.eauction.gr{pdf_href}"
                                            if not pdf_href.startswith("http")
                                            else pdf_href
                                        )
                                        all_pdf_links.append(full_pdf_url)
                                        print(f"PDF {i+1}: {full_pdf_url} (title: {pdf_title})")
                                        # If title starts with 'report', prefer this for analysis
                                        if not pdf_href_for_analysis and pdf_title and pdf_title.lower().startswith("report"):
                                            pdf_href_for_analysis = full_pdf_url
                                if not all_pdf_links:
                                    print(f"Warning: PDF containers found but no valid links for auction #{idx+1}")
                            else:
                                print(f"No PDF anchors found for auction #{idx+1}")
                                all_pdf_links = []

                            # Set the PDF for analysis: prefer 'report', else first
                            if not pdf_href_for_analysis and all_pdf_links:
                                pdf_href_for_analysis = all_pdf_links[0]
                            pdf_href = pdf_href_for_analysis
                            if pdf_href:
                                print(f"Using PDF for analysis: {pdf_href}")

                            # Process only the SELECTED PDF with Gemini if available
                            if pdf_href and gemini_model:
                                try:
                                    print(f"Processing selected PDF for auction #{idx+1}")
                                    # Human-like delay before PDF processing
                                    human_like_delay(0.9, 1.8)

                                    # Download and extract PDF text
                                    pdf_text = download_and_extract_pdf_text(pdf_href)

                                    # OPTIONAL: Log raw PDF text for testing
                                    print("---------- RAW PDF TEXT ----------")
                                    print(pdf_text[:2000])  # First 2000 characters
                                    print("---------- END TEXT -------------")

                                    # Analyze with Gemini
                                    if pdf_text:
                                        gemini_json_response = (
                                            analyze_pdf_with_gemini(
                                                pdf_text, gemini_model
                                            )
                                        )
                                        if gemini_json_response:
                                            try:
                                                # Clean up response string
                                                if (
                                                    "```json" in gemini_json_response
                                                ):
                                                    gemini_json_response = (
                                                        gemini_json_response.split(
                                                            "```json"
                                                        )[1].split("```")[0]
                                                    )
                                                elif "```" in gemini_json_response:
                                                    gemini_json_response = (
                                                        gemini_json_response.split(
                                                            "```"
                                                        )[1]
                                                    )

                                                # DEBUG LOGGING
                                                print(
                                                    "--------- Gemini Raw JSON Response ----------"
                                                )
                                                print(gemini_json_response)
                                                print(
                                                    "--------------------------------------------"
                                                )

                                                data = json.loads(
                                                    gemini_json_response.strip()
                                                )
                                                pdf_analysis.update(data)

                                                # Add price_per_sqm logic only if area and price are valid
                                                area = data.get("property_area")

                                                # Parse Greek-formatted price properly
                                                numeric_price = parse_greek_number(
                                                    price
                                                )

                                                # Also handle Greek-formatted area from PDF if needed
                                                if isinstance(area, str):
                                                    area = parse_greek_number(area)

                                                if (
                                                    area
                                                    and numeric_price
                                                    and isinstance(
                                                        area, (int, float)
                                                    )
                                                    and area > 0
                                                ):
                                                    price_per_sqm = (
                                                        numeric_price / area
                                                    )
                                                    pdf_analysis[
                                                        "price_per_sqm"
                                                    ] = f"€{price_per_sqm:,.2f}"
                                                else:
                                                    pdf_analysis[
                                                        "price_per_sqm"
                                                    ] = "N/A"

                                                print(
                                                    f"Gemini analysis completed for auction #{idx+1}"
                                                )
                                            except (
                                                json.JSONDecodeError,
                                                KeyError,
                                                Exception,
                                            ) as e:
                                                print(
                                                    f"Error parsing Gemini JSON for auction #{idx+1}: {e}"
                                                )
                                        else:
                                            print(
                                                f"Gemini returned no response for auction #{idx+1}"
                                            )
                                    else:
                                        print(
                                            f"Could not extract text from PDF for auction #{idx+1}"
                                        )
                                except Exception as e:
                                    print(f"Error processing PDF for auction #{idx+1}: {e}")

                        except Exception as e:
                            print(
                                f"Error scraping detail page for auction #{idx+1}: {e}"
                            )
                            detail_info = None
                            duration = None
                            pdf_href = None
                            all_pdf_links = []
                        finally:
                            # Close detail page
                            detail_page.close()
                            # Random delay after closing detail page
                            human_like_delay(0.8, 1.7)
                    else:
                        pdf_href = None
                        all_pdf_links = []
                        duration = None

                    # AI Labeling Logic
                    ai_labels = []
                    simple_tag = "N/A"
                    numeric_price = parse_greek_number(price)
                    price_per_sqm_str = pdf_analysis.get("price_per_sqm", "N/A")
                    price_per_sqm = (
                        parse_greek_number(price_per_sqm_str)
                        if price_per_sqm_str != "N/A"
                        else None
                    )

                    # 1. Incomplete
                    if not pdf_href or not pdf_analysis.get("property_area"):
                        ai_labels.append("Incomplete")
                        simple_tag = "Incomplete"

                    # 2. Πτώχευση (Bankruptcy)
                    if pdf_analysis.get("is_bankruptcy"):
                        ai_labels.append("Πτώχευση")

                    # 3. Expensive
                    if price_per_sqm and price_per_sqm > 1500:
                        ai_labels.append("Expensive")
                        simple_tag = "Expensive"

                    # 4. Καλή Ευκαιρία & Hot
                    is_within_3_weeks = False
                    if conduct_date and conduct_date != "N/A":
                        try:
                            auction_date_obj = datetime.strptime(
                                conduct_date, "%d/%m/%Y"
                            )
                            if (
                                auction_date_obj >= datetime.now()
                                and (auction_date_obj - datetime.now()).days <= 21
                            ):
                                is_within_3_weeks = True
                        except (ValueError, TypeError):
                            pass

                    if (
                        price_per_sqm
                        and price_per_sqm < 600
                        and pdf_analysis.get("property_area", 0) > 70
                        and is_within_3_weeks
                    ):
                        ai_labels.append("Καλή Ευκαιρία")
                        simple_tag = "Opportunity"

                        # Check for 'Hot'
                        if pdf_analysis.get(
                            "property_description"
                        ) and pdf_analysis.get("property_description") not in [
                            "N/A",
                            "",
                            None,
                        ]:
                            ai_labels.append("Hot")

                    # 5. Προσοχή (Caution)
                    low_price_threshold = 50000
                    has_risks = "υποθήκη" in pdf_analysis.get(
                        "notes", ""
                    ) or "βάρη" in pdf_analysis.get("notes", "")
                    if (
                        numeric_price
                        and numeric_price < low_price_threshold
                        and (has_risks or "Incomplete" in ai_labels)
                    ):
                        ai_labels.append("Προσοχή")

                    # Add to results, merging pdf_analysis data
                    result_item = {
                        "code": uniqueCode,
                        "part_number": partLabel,
                        "post_date": postDate,
                        "auction_object": kind,
                        "status": status,
                        "price": price,  # This is the Starting Price from the list
                        "date": conduct_date,
                        "debtor": debtor,
                        "kind": kind,  # Retaining for compatibility if needed elsewhere
                        "region": region,
                        "municipality": municipality,
                        "detail_link": detail_link,
                        "pdf_href": pdf_href,  # First PDF (for backward compatibility)
                        "all_pdf_links": all_pdf_links,  # All PDF links
                        "ai_labels": ai_labels,
                        "simple_tag": simple_tag,
                        # Add filter context for debugging
                        "filter_context": {
                            "selectedRegion": selectedRegion,
                            "selectedMunicipality": selectedMunicipality,
                            "selectedPropertyType": selectedPropertyType,
                        }
                    }
                    result_item.update(pdf_analysis)  # Merge PDF data
                    results.append(result_item)

                    print(f"Completed processing auction #{idx+1}")

                except Exception as e:
                    print(f"Error parsing auction #{idx+1}: {e}")
                    results.append({"error": f"Error parsing auction #{idx+1}: {e}"})
                    continue

        except Exception as e:
            print(f"Error loading page or extracting data: {e}")
            results.append({"error": f"Error loading page or extracting data: {e}"})
        finally:
            # Clean up
            context.close()
            browser.close()

    print(f"\nCompleted scraping {len(results)} auctions")
    return {"results": results, "total_results": total_results}


def configure_gemini():
    """Configure Gemini API with your API key"""
    api_key = config.get("GEMINI_API_KEY")  # Use config dictionary
    if not api_key:
        print("Warning: GEMINI_API_KEY not set. PDF analysis will be skipped.")
        return None

    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def download_and_extract_pdf_text(pdf_url):
    """Download PDF and extract text content with human-like delays, unless bypassed"""
    try:
        # Add random delay before downloading
        if not BYPASS_HUMAN_BEHAVIOR:
            time.sleep(random.uniform(0.3, 0.8))

        # Set headers to mimic a real browser
        headers = {
            "User-Agent": get_random_user_agent(),
            "Accept": "application/pdf,*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

        # Download the PDF
        response = requests.get(pdf_url, headers=headers, timeout=30)
        response.raise_for_status()

        # Extract text from PDF
        pdf_file = io.BytesIO(response.content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)

        text_content = ""
        for page in pdf_reader.pages:
            text_content += page.extract_text().strip() + "\n"

        return text_content.strip()
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return None


def analyze_pdf_with_gemini(text_content, model):
    """Analyze PDF content using Gemini with better prompt structure and few-shot guidance. Respects bypass flag."""
    if not model or not text_content:
        return None

    try:
        # Add delay to respect API rate limits
        if not BYPASS_HUMAN_BEHAVIOR:
            time.sleep(random.uniform(0.4, 0.8))  # Reduced from 0.8-1.5

        # Clean and trim text to stay within token limits
        cleaned_text = "\n".join(
            [line.strip() for line in text_content.splitlines() if line.strip()]
        )
        cleaned_text = cleaned_text[:14000]  # Keep within safe input length

        prompt = """
You are a real estate analyst. Analyze the following Greek auction document and extract structured information.

Return a valid JSON with the following keys:
- "property_area": Total area in square meters (combine if multiple, e.g., for multiple floors or spaces). Use only numbers as float (e.g., 130.06). Accept formats like "εμβαδόν 88,52 τ.μ.", "88,52 τ.μ.", "συνολική επιφάνεια 124,35". If not found, return null.
- "starting_price": Starting price in euros. Use only numbers as float (e.g., 123000.0). If not found, return null.
- "address": Street, number, area. Combine multiple lines if needed. Normalize and clean address fields (remove extra line breaks, labels like "Οδός", etc.). If not found, return "N/A".
- "property_description": One or two sentence description of the property usage/type/location. If not found, return "N/A".
- "notes": Any special conditions or clauses like rights, restrictions, mortgages, liens, third-party rights, servitudes, pending legal issues, or if the auction is related to debt, mortgage, or enforcement. If not found, return "N/A".
- "occupancy_status":
  - If text contains: "κατοικείται", "ένοικος", "μισθωτήριο", "ενοικιαστής", "διαμένει" → return "Κατοικείται"
  - If contains: "ακατοίκητο", "μη κατοικούμενο", "χωρίς χρήση" → return "Ακατοίκητο"
  - If contains: "εκκενωμένο", "εκκενώθηκε" → return "Εκκενωμένο"
  - Otherwise → return "N/A"
- "is_bankruptcy": true if the text contains any of the following: "πτώχευση", "εκκαθάριση", "ειδική διαχείριση", "πτωχευτική διαδικασία", "υπό εκκαθάριση", "λύση εταιρείας", otherwise false.
- "property_type": The specific type of property (e.g., "Διαμέρισμα", "Οικόπεδο", "Αγροτεμάχιο", "Κατάστημα", "Μονοκατοικία"). Try to infer from descriptions even if not explicit. If not found, return "N/A".

ADDITIONAL RULES:
- For Greek numbers like "94.000,50", convert to float: 94000.5
- Accept formats like "εμβαδόν 88,52 τ.μ.", "88,52 τ.μ.", "συνολική επιφάνεια 124,35"
- If multiple areas are mentioned (e.g., 2 floors), sum them.
- Normalize and clean address fields (remove extra line breaks, labels like "Οδός", etc.)
- If auction is related to debt, mortgage, enforcement, extract that into "notes".

Example output format:
{
  "property_area": 344.06,
  "starting_price": 123000.0,
  "address": "Παπαζαχαρίου 54, Λάρισα, Φιλιππούπολη",
  "property_description": "Διαμέρισμα πρώτου ορόφου, κατάλληλο για κατοικία.",
  "notes": "Υπάρχει υποθήκη υπέρ της Συνεταιριστικής Τράπεζας Θεσσαλίας.",
  "occupancy_status": "Κατοικείται",
  "is_bankruptcy": false,
  "property_type": "Διαμέρισμα"
}

Document:
"""

        # Send to Gemini
        response = model.generate_content(prompt + "\n" + cleaned_text)
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None


def send_telegram_notification(message):
    """Sends a message to a Telegram chat, reading config from .env."""
    bot_token = config.get("TELEGRAM_BOT_TOKEN")  # Use config dictionary
    chat_id = config.get("TELEGRAM_CHAT_ID")      # Use config dictionary

    if not bot_token or not chat_id:
        print("Warning: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Skipping notification.")
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()
        print("Telegram notification sent successfully.")
    except requests.exceptions.RequestException as e:
        print(f"Error sending Telegram notification: {e}")
        if e.response is not None:
            print(f"Response body: {e.response.text}")


if __name__ == "__main__":
    print("Starting auction scraper with human-like behavior...")
    auctions = scrape_auctions()
    for idx, auction in enumerate(auctions["results"]):
        print(f"Auction #{idx+1}: {auction}")
