from playwright.sync_api import sync_playwright
import json
import time


def scrape_regions_and_municipalities():
    url = "https://www.eauction.gr/en/Home/HlektronikoiPleistiriasmoi?conductFrom=01/07/2025&conductTo=08/07/2025&sortAsc=true&sortId=1&conductedSubTypeId=1&page=1&type=1&extendedFilter1=1,1,1"
    data = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        try:
            page.goto(url, timeout=60000)
            page.wait_for_load_state("networkidle")
            time.sleep(3)

            # Based on the screenshot, the region selector appears to be the select with regions
            region_selector = "select[name='AddedFilter3Select']"

            # Try alternative selectors if the first one doesn't work
            possible_selectors = [
                "select[name='AddedFilter3Select']",
                "#AddedFilter3Select",
                "select:has(option[value='14'])",  # Based on screenshot showing option value="14"
                "div:has(label:text('Region')) select",
                "select:nth-of-type(3)",  # Third select element
            ]

            region_selector_found = None
            for selector in possible_selectors:
                try:
                    page.wait_for_selector(selector, timeout=5000)
                    region_selector_found = selector
                    print(f"Found region selector: {selector}")
                    break
                except:
                    continue

            if not region_selector_found:
                raise Exception("Could not find region selector")

            # Get all region options (skip 'Select All' or empty values)
            region_options = page.query_selector_all(f"{region_selector_found} option")
            print(f"Found {len(region_options)} region options")

            for idx, region_option in enumerate(region_options):
                region_value = region_option.get_attribute("value")
                region_name = region_option.inner_text().strip()

                print(
                    f"Processing region {idx}: '{region_name}' (value: '{region_value}')"
                )

                # Skip 'Select All' or empty options
                if (
                    not region_value
                    or region_value == ""
                    or region_name.lower() in ["select all", ""]
                ):
                    continue

                # Select the region
                page.select_option(region_selector_found, value=region_value)
                time.sleep(3)  # Wait for municipalities to load

                # Find municipality selector
                municipality_selector_found = None
                municipality_selectors = [
                    "select[name='AddedFilter4Select']",
                    "#AddedFilter4Select",
                    "div:has(label:text('Municipality')) select",
                    "select:nth-of-type(4)",  # Fourth select element
                ]

                municipalities = []
                for mun_selector in municipality_selectors:
                    try:
                        page.wait_for_selector(mun_selector, timeout=5000)
                        municipality_options = page.query_selector_all(
                            f"{mun_selector} option"
                        )

                        for mun_option in municipality_options:
                            mun_value = mun_option.get_attribute("value")
                            mun_name = mun_option.inner_text().strip()

                            # Skip empty or "Select All" options
                            if (
                                mun_value
                                and mun_value != ""
                                and mun_name.lower() not in ["select all", ""]
                            ):
                                municipalities.append(
                                    {"name": mun_name, "value": mun_value}
                                )

                        print(
                            f"Found {len(municipalities)} municipalities for {region_name}"
                        )
                        municipality_selector_found = mun_selector
                        break
                    except:
                        continue

                if not municipalities:
                    print(f"No municipalities found for region: {region_name}")

                # Store region data with both name and value
                data[region_name] = {
                    "region_value": region_value,
                    "municipalities": municipalities,
                }

        except Exception as e:
            print(f"Error occurred: {e}")
            # Take a screenshot for debugging
            page.screenshot(path="debug_screenshot.png")
            raise
        finally:
            browser.close()

    return data


def debug_page_structure():
    """Helper function to debug the page structure"""
    url = "https://www.eauction.gr/en/Home/HlektronikoiPleistiriasmoi?conductFrom=01/07/2025&conductTo=08/07/2025&sortAsc=true&sortId=1&conductedSubTypeId=1&page=1&type=1&extendedFilter1=1,1,1"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(url, timeout=60000)
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        # Print all form elements
        print("=== ALL SELECT ELEMENTS ===")
        selects = page.query_selector_all("select")
        for i, select in enumerate(selects):
            select_id = select.get_attribute("id")
            select_name = select.get_attribute("name")
            select_class = select.get_attribute("class")
            options = select.query_selector_all("option")
            print(f"\nSelect {i}:")
            print(f"  ID: {select_id}")
            print(f"  Name: {select_name}")
            print(f"  Class: {select_class}")
            print(f"  Options ({len(options)}):")
            for j, opt in enumerate(options[:10]):  # Show first 10 options
                opt_value = opt.get_attribute("value")
                opt_text = opt.inner_text().strip()
                print(f"    {j}: '{opt_text}' (value: '{opt_value}')")
            if len(options) > 10:
                print(f"    ... and {len(options) - 10} more")

        print("\n=== LOOKING FOR REGION/MUNICIPALITY LABELS ===")
        labels = page.query_selector_all("label")
        for i, label in enumerate(labels):
            label_text = label.inner_text().strip()
            label_for = label.get_attribute("for")
            if any(
                keyword in label_text.lower()
                for keyword in ["region", "municipality", "area"]
            ):
                print(f"Label {i}: '{label_text}' (for: '{label_for}')")

        input("Press Enter to close browser...")
        browser.close()


def save_results(data, filename="region_municipality_map.json"):
    """Save results with better formatting"""
    if data:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Saved region-municipality mapping to {filename}")
        print(f"Found {len(data)} regions")

        # Print summary
        total_municipalities = sum(
            len(region_data["municipalities"]) for region_data in data.values()
        )
        print(f"Total municipalities: {total_municipalities}")

        # Print first few regions as sample
        print("\nSample data:")
        for i, (region_name, region_data) in enumerate(data.items()):
            if i < 3:  # Show first 3 regions
                print(f"  {region_name} (value: {region_data['region_value']})")
                for j, mun in enumerate(
                    region_data["municipalities"][:3]
                ):  # First 3 municipalities
                    print(f"    - {mun['name']} (value: {mun['value']})")
                if len(region_data["municipalities"]) > 3:
                    print(
                        f"    ... and {len(region_data['municipalities']) - 3} more municipalities"
                    )
    else:
        print("No data was scraped")


if __name__ == "__main__":
    # Uncomment the next line to debug page structure first
    # debug_page_structure()

    try:
        result = scrape_regions_and_municipalities()
        save_results(result)
    except Exception as e:
        print(f"Scraping failed: {e}")
        print(
            "Try running debug_page_structure() first to identify the correct selectors"
        )
