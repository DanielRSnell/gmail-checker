import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';

// Function to extract domain from email
function extractDomain(email) {
  if (email) {
  return email.split('@')[1];
  }
}

// Function to process emails and write unique domains to a new CSV
async function processEmails(inputFilePath, outputFilePath) {
  const uniqueDomains = new Set();
  const readStream = fs.createReadStream(inputFilePath);

  readStream
    .pipe(csvParser(['email']))
    .on('data', (row) => {
      const domain = extractDomain(row.email);
      uniqueDomains.add(domain);
    })
    .on('end', () => {
      // Convert the Set to an array of objects for csv-writer
      const domainRecords = Array.from(uniqueDomains).map(domain => ({ Domain: domain }));
      
      const csvWriter = createCsvWriter({
        path: outputFilePath,
        header: [{id: 'Domain', title: 'Domains'}]
      });
      
      csvWriter.writeRecords(domainRecords)
        .then(() => console.log('The CSV file was written successfully'));
    });
}

// Specify your input and output file paths
const inputFilePath = './emails.csv';
const outputFilePath = './unique-domains.csv';

processEmails(inputFilePath, outputFilePath);
