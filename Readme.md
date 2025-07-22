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

## Telegram Bot Integration

The server can send notifications to a Telegram chat using a bot. To enable this feature, you need to set up the following environment variables in your `server/.env` file:

- `TELEGRAM_BOT_TOKEN`: The token for your Telegram bot. You can obtain this by creating a bot with [@BotFather](https://t.me/BotFather) on Telegram.
- `TELEGRAM_CHAT_ID`: The chat ID where notifications will be sent. You can get your chat ID by messaging your bot and using a tool like [userinfobot](https://t.me/userinfobot) or by checking the updates from the [getUpdates](https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates) endpoint.

### Example `server/.env` entries:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

If these variables are not set, Telegram notifications will be skipped.

### How it works
- The server uses these variables to send messages via the Telegram Bot API when certain events occur (e.g., after scraping or on errors).
- You can customize the notification logic in `server/scraper.py` (see the `send_telegram_notification` function).