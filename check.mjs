import csv from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { promises as dns } from 'dns';
import fs from 'fs';

const results = [];
const emailsWithGsuite = [];
const invalidEmails = [];
let processedCount = 0;

// Known G Suite MX records hostnames
const gsuiteMxRecords = [
  'ASPMX.L.GOOGLE.COM',
  'ALT1.ASPMX.L.GOOGLE.COM',
  'ALT2.ASPMX.L.GOOGLE.COM',
  'ALT3.ASPMX.L.GOOGLE.COM',
  'ALT4.ASPMX.L.GOOGLE.COM',
];

fs.createReadStream('emails.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    for (const row of results) {
      const emailDomain = row.email.split('@')[1];
      processedCount++;

      // Automatically add gmail.com domains to the output array
      if (emailDomain === 'gmail.com') {
        emailsWithGsuite.push(row);
        console.log(`Processed email ${processedCount}: ${row.email} - Gmail domain`);
      } else {
        try {
          const addresses = await dns.resolveMx(emailDomain);
          const hasGsuiteMx = addresses.some((address) =>
            gsuiteMxRecords.includes(address.exchange.toUpperCase())
          );
          if (hasGsuiteMx) {
            emailsWithGsuite.push(row);
            console.log(`Processed email ${processedCount}: ${row.email} - G Suite domain`);
          } else {
            console.log(`Processed email ${processedCount}: ${row.email} - Non-G Suite domain`);
          }
        } catch (err) {
          invalidEmails.push(row);
          console.error(`Error resolving MX for domain: ${emailDomain}`, err);
          console.log(`Processed email ${processedCount}: ${row.email} - Error`);
        }
      }

      // Write the output CSV files every 1000 emails processed
      if (processedCount % 1000 === 0) {
        await writeOutputCsv();
        await writeInvalidCsv();
      }
    }

    // Write the final output CSV files
    await writeOutputCsv();
    await writeInvalidCsv();
    console.log('The CSV files were written successfully');
  });

async function writeOutputCsv() {
  const csvWriter = createCsvWriter({
    path: `gmail-output.csv`,
    header: [
      { id: 'email', title: 'Email' },
    ],
  });

  await csvWriter.writeRecords(emailsWithGsuite);
  console.log(`Intermediate valid emails CSV file written - Processed count: ${processedCount}`);
}

async function writeInvalidCsv() {
  const csvWriter = createCsvWriter({
    path: `invalid-emails.csv`,
    header: [
      { id: 'email', title: 'Email' },
    ],
  });

  await csvWriter.writeRecords(invalidEmails);
  console.log(`Intermediate invalid emails CSV file written - Processed count: ${processedCount}`);
}