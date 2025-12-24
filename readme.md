# Log Analytics Dashboard

A modern full-stack application for monitoring and analyzing user activity logs.

## Features

-   **Backend Data Ingestion**: Simple REST API (`POST /api/logs`) to receive JSONL log data.
-   **MongoDB Storage**: Scalable storage of log entries.
-   **Interactive Dashboard**:
    -   Visualize user activity over time.
    -   Analyze session durations and engagement.
    -   Track page views, clicks, and device statistics.
    -   Filter data by User Agent.
-   **Excel Export**: Export filtered data for further analysis.
-   **Local File Import**: Drag and drop support for `json` and `jsonl` files.

## Technology Stack

-   **Frontend**: React, TypeScript, Vite, Recharts
-   **Backend**: Node.js, Express, Mongoose
-   **Database**: MongoDB

## Getting Started

### Prerequisites

-   Node.js (v16+)
-   MongoDB (running locally on default port 27017)

### Installation

1.  **Clone the repository**
2.  **Install Frontend Dependencies**:
    ```bash
    cd frontend
    npm install
    ```
3.  **Install Backend Dependencies**:
    ```bash
    cd backend
    npm install
    ```

### Running the Application

1.  **Start MongoDB**: Ensure your MongoDB instance is running.
2.  **Start Backend Server**:
    ```bash
    cd backend
    npm run dev
    ```
    (Runs on `http://localhost:5000`)
3.  **Start Frontend Dev Server**:
    ```bash
    cd frontend
    npm run dev
    ```
    (Runs on `http://localhost:5173`)

## API Endpoints

-   `POST /api/logs`: Ingest logs (accepts JSON array or JSONL).
-   `GET /api/logs`: Fetch logs (supports `userAgent` query param).
-   `GET /api/user-agents`: Get list of unique user agents.

## Usage

-   Open the dashboard in your browser.
-   Data fetched from the backend is displayed automatically.
-   Use the dropdown to filter by User Agent.
-   Drag and drop additional local log files if needed.
