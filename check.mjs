import csv from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { promises as dns } from 'dns';
import fs from 'fs';

const results = [];
const emailsWithGsuite = [];

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
      
      // Automatically add gmail.com domains to the output array
      if (emailDomain === 'gmail.com') {
        emailsWithGsuite.push(row);
        continue;
      }

      try {
        const addresses = await dns.resolveMx(emailDomain);
        const hasGsuiteMx = addresses.some((address) =>
          gsuiteMxRecords.includes(address.exchange.toUpperCase())
        );
        if (hasGsuiteMx) {
          emailsWithGsuite.push(row);
        }
      } catch (err) {
        console.error(`Error resolving MX for domain: ${emailDomain}`, err);
      }
    }
    
    const csvWriter = createCsvWriter({
      path: 'gmail-output.csv',
      header: [
        { id: 'email', title: 'Email' },
      ],
    });

    await csvWriter.writeRecords(emailsWithGsuite);
    console.log('The CSV file was written successfully');
  });
