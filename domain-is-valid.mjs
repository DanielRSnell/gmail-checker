import csv from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { promises as dns } from 'dns';
import fs from 'fs';
import chalk from 'chalk';

const results = [];
const invalidDomains = [];
const googleDomains = [];
let processedCount = 0;

// Known G Suite MX records hostnames
const gsuiteMxRecords = [
  'ASPMX.L.GOOGLE.COM',
  'ALT1.ASPMX.L.GOOGLE.COM',
  'ALT2.ASPMX.L.GOOGLE.COM',
  'ALT3.ASPMX.L.GOOGLE.COM',
  'ALT4.ASPMX.L.GOOGLE.COM',
];

fs.createReadStream('unique-domains.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    const totalDomains = results.length;

    for (const row of results) {
      const domain = row.Domains;
      processedCount++;

      try {
        const addresses = await dns.resolveMx(domain);
        const hasGsuiteMx = addresses.some((address) =>
          gsuiteMxRecords.includes(address.exchange.toUpperCase())
        );

        if (hasGsuiteMx || domain === 'gmail.com') {
          googleDomains.push(row);
          console.log(
            chalk.blue(
              `${processedCount} | ${totalDomains} | ${domain} | GOOGLE`
            )
          );
        } else {
          console.log(
            chalk.green(
              `${processedCount} | ${totalDomains} | ${domain} | SUCCESS`
            )
          );
        }
      } catch (err) {
        invalidDomains.push(row);
        console.error(
          chalk.red(
            `${processedCount} | ${totalDomains} | ${domain} | FAILED/INVALID`
          ),
        );
      }

      // Write the output CSV files every 1000 domains processed
      if (processedCount % 1000 === 0) {
        await writeInvalidCsv();
        await writeGoogleCsv();
      }
    }

    // Write the final output CSV files
    await writeInvalidCsv();
    await writeGoogleCsv();
    console.log('The CSV files were written successfully');
  });

async function writeInvalidCsv() {
  const csvWriter = createCsvWriter({
    path: `invalid-domains.csv`,
    header: [{ id: 'Domains', title: 'Domains' }],
  });
  await csvWriter.writeRecords(invalidDomains);
  console.log(
    chalk.yellow(
      `Intermediate invalid domains CSV file written - Processed count: ${processedCount}`
    )
  );
}

async function writeGoogleCsv() {
  const csvWriter = createCsvWriter({
    path: `google-domains.csv`,
    header: [{ id: 'Domains', title: 'Domains' }],
  });
  await csvWriter.writeRecords(googleDomains);
  console.log(
    chalk.yellow(
      `Intermediate Google domains CSV file written - Processed count: ${processedCount}`
    )
  );
}