# 🚀 ch-automation-project

Welcome to the ch-automation-project! This project provides an automated testing suite designed with Playwright. It helps ensure the quality and functionality of the application through robust end-to-end and API tests.

## Prerequisites
Before you start, make sure you have the following installed on your system:

Node.js: Version 18 or higher. You can download it from nodejs.org.

npm (Node Package Manager): This comes bundled with Node.js.

## Getting Started

Follow these steps to set up and run the project locally.

## ⬇️ Installation

Clone the repository:

Bash

git clone https://github.com/iCodeIeu/ch-automation-project.git

Navigate to the project directory:

Bash

cd ch-automation-project

Install dependencies:

This command installs all the necessary packages listed in package.json, including Playwright and its browsers.

Bash

npm install

Playwright will automatically download the required browser binaries (Chromium, Firefox, and WebKit) during the installation process.

npx playwright install

If the tests fail to run due to missing browsers, or if you are prompted, you may need to explicitly install the Playwright browsers:

### ▶️ Running Tests

All tests are run using the Playwright Test Runner.

Run all tests in UI mode: This command opens the Playwright UI, allowing you to selectively run, debug, and inspect tests.

Bash

npx playwright test --ui

### Run all tests headlessly:

This executes all tests in the project without opening a browser GUI. Results are shown in the terminal.

Bash

npx playwright test

#### Run a specific test file:

Replace path/to/your/test-file.spec.ts with the actual path to the test file you want to run.

Bash

npx playwright test path/to/your/test-file.spec.ts

#### Run tests with a specific browser:

To run tests only in Chromium:

Bash

npx playwright test --project=chromium

You can also specify firefox or webkit.

## 📂 Project Structure

The project is organized to promote maintainability and scalability, separating concerns into logical directories:

```
├── tests/
│ ├── common/
│ │ ├── fixtures/ # Custom Playwright fixtures (e.g., page-fixture, reservation-fixture)
│ │ ├── pages/ # Page Object Models (POMs) for UI interaction
│ │ │ ├── admin.ts
│ │ │ ├── home.ts
│ │ │ ├── navigation-bar.ts
│ │ │ └── room-details.ts
│ │ └── utils/ # Shared utilities, constants, and helper functions
│ │ ├── api-helpers.ts
│ │ ├── constants.ts
│ │ ├── setup-helpers.ts
│ │ ├── shared-helpers.ts
│ │ └── types.ts
│ └── microservices/ # API test suites organized by microservice
│ ├── auth/
│ │ ├── coverage/
│ │ └── specs/ # Auth API test specifications
│ ├── booking/
│ │ ├── coverage/
│ │ └── specs/ # Booking API test specifications
│ └── message/
│ ├── coverage/
│ └── specs/ # Message API test specifications
└── visual-snapshots/ # Stores visual regression test snapshots
```

## 🧹 Code Formatting

This project uses Prettier for code formatting to maintain consistency.

Format code:
This command formats all supported files in the project.

Bash

npm run prettier:format

Check code formatting:

This command checks if any files need reformatting without actually changing them.

Bash

npm run prettier:check-format

## 🤝 Contributing

Feel free to contribute to this project! If you find a bug or have an enhancement idea, please open an issue or submit a pull request.

## 🐛 Reporting Issues

If you encounter any issues or bugs, please report them on the GitHub Issues page.
