# Email Domain MX Record Checker

This project includes a Node.js script that reads email addresses from a CSV file, checks their domain's MX records to determine if they are using G Suite/Google Workspace, and outputs those emails to another CSV file.

## Requirements

- Node.js (v12.x or later)
- npm (comes with Node.js)

## Setup

1. Clone this repository or download the project files.
2. Navigate to the project directory in your terminal or command prompt.
3. Run `npm install` to install the required dependencies.

## Input File Format

The input CSV file (`emails.csv`) should have the following format:

Ensure the first row contains the header `email`, and each subsequent row contains one email address.

## How to Use

1. Place your `emails.csv` file in the project's root directory.
2. Run the script using Node.js by executing the following command in your terminal or command prompt:

```bash
node check.mjs
```
