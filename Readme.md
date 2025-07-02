# Real Estate Scraper

This project consists of a client and a server.

## Environment Variables

Both the `client` and `server` directories contain a `.env.example` file. Before running the project, you should:

1. Copy the `.env.example` file to `.env` in each directory:
    - For the client:
      ```bash
      cp client/.env.example client/.env
      ```
    - For the server:
      ```bash
      cp server/.env.example server/.env
      ```
2. Open each `.env` file and fill in the required environment variable values as needed for your setup.

## Client (Vite + React)

### Installation

1.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the development server

```bash
npm run dev
```

## Server (Python)

### Installation

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies from `requirements.txt`:
    ```bash
    pip install -r requirements.txt
    ```

### Running the server

```bash
python app.py
```