# 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

## Prerequisites

- **Node.js**: Make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org).
- **Google Gemini API Key**:
  1. Go to the [Google AI Studio](https://makersuite.google.com/app).
  2. Click **"Create API key"** and copy the key.

## Installation

### Clone the repository (or download the source code) to your local machine.

### Set up the Backend:

1. Navigate into the cloned-repo directory:

    ```bash
    cd cloned-repo-name
    ```

2. Install the required NPM packages:

    ```bash
    npm install
    ```

3. Create a new file named `.env` in the `backend-node` directory.

4. Add your Gemini API key to the `.env` file:

    ```env
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

### Frontend Setup:

- The frontend uses plain HTML, CSS, and JS, so **no installation is required!**

## Running the Application

You need to have two terminals open: one for the backend server and one for serving the frontend.

### Start the Backend Server:

1. In your terminal, from the `cloned-repo-name` directory, run:

    ```bash
    node server.js
    ```

2. You should see a confirmation message:

    ```
    Node.js server listening at http://localhost:3000
    ```

### Launch the Frontend:

1. The easiest way to run the frontend is to use a simple **Live Server** extension.
   - If you're using Visual Studio Code, install the **Live Server** extension.
   - Right-click the `index.html` file and select **"Open with Live Server"**.

2. This will open the application in your browser.

> If you don't use Live Server, you can simply open the `index.html` file directly in your web browser.
