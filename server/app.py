from flask import Flask, render_template_string, jsonify, request
from flask_cors import CORS
from scraper import scrape_auctions

app = Flask(__name__)
CORS(app)

DASHBOARD_HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Auction Scraper Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        button { padding: 10px 20px; font-size: 16px; }
        #results { margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>Auction Scraper Dashboard</h1>
    <button id="scrapeBtn">Start Scraping</button>
    <div id="status"></div>
    <div id="results"></div>
    <script>
        document.getElementById('scrapeBtn').onclick = function() {
            document.getElementById('status').innerText = 'Scraping in progress...';
            document.getElementById('results').innerHTML = '';
            fetch('/scrape', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    document.getElementById('status').innerText = 'Scraping complete!';
                    if (data.results && data.results.length > 0) {
                        let html = '<table><tr><th>Status</th><th>Price</th><th>Date</th><th>Debtor</th><th>Kind</th><th>Region</th><th>Municipality</th><th>Detail Link</th></tr>';
                        data.results.forEach(item => {
                            if (item.error) {
                                html += `<tr><td colspan='8' style='color:red;'>${item.error}</td></tr>`;
                            } else {
                                html += `<tr><td>${item.status}</td><td>${item.price}</td><td>${item.date}</td><td>${item.debtor}</td><td>${item.kind}</td><td>${item.region}</td><td>${item.municipality}</td><td><a href='${item.detail_link}' target='_blank'>Link</a></td></tr>`;
                            }
                        });
                        html += '</table>';
                        document.getElementById('results').innerHTML = html;
                    } else {
                        document.getElementById('results').innerText = 'No results.';
                    }
                })
                .catch(err => {
                    document.getElementById('status').innerText = 'Error during scraping.';
                    document.getElementById('results').innerText = err;
                });
        };
    </script>
</body>
</html>
'''

@app.route("/")
def dashboard():
    return render_template_string(DASHBOARD_HTML)

@app.route("/scrape", methods=["POST"])
def scrape():
    # Get filter parameters from request
    data = request.get_json()  # Use get_json() instead of request.json
    print("Raw request data:", data)  # Debug log
    
    conduct_from = data.get('conductFrom')
    conduct_to = data.get('conductTo')
    posting_from = data.get('postingFrom')
    posting_to = data.get('postingTo')
    sort_by = data.get('sortBy', 'auctionDateAsc')
    page = data.get('page', 1)
    regionParam = data.get('regionParam')
    propertyParam = data.get('propertyParam')
    municipalityParam = data.get('municipalityParam')
    
    print("Extracted parameters:")  # Debug log
    print(f"- conductFrom: {conduct_from}")
    print(f"- conductTo: {conduct_to}")
    print(f"- postingFrom: {posting_from}")
    print(f"- postingTo: {posting_to}")
    print(f"- sortBy: {sort_by}")
    print(f"- page: {page}")
    print(f"- regionParam: {regionParam}")
    print(f"- propertyParam: {propertyParam}")
    print(f"- municipalityParam: {municipalityParam}")

    # Call scraper with filters
    results = scrape_auctions(
        conduct_from=conduct_from,
        conduct_to=conduct_to,
        posting_from=posting_from,
        posting_to=posting_to,
        sort_by=sort_by,
        page=page,
        regionParam=regionParam,
        propertyParam=propertyParam,
        municipalityParam=municipalityParam
    )
    return jsonify({"results": results})

if __name__ == "__main__":
    app.run(debug=True)
