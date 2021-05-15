const pup = require('puppeteer');

(async () => {
  const b = await pup.launch({headless:false});
  // Closes the browser if the process is longer then 1 minutes, helps to close crashed headless chrome
  setTimeout(async () => {
    console.log('CLOSING BROWSER AUTOMATICALLY')
    await b.close()
  }, 60000);
  const p = await b.newPage();
  await p.goto('https://myanimelist.net/topanime.php', {waitUntil: 'networkidle0'});

  try {
    const pages = await p.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.top-ranking-table tr td h3 a'));
      return els.map(e => { return { name: e.innerText, url: e.href } });
    });
    await p.close();
    const data = {};
    for (const [i, ap] of pages.entries()) {
      console.log(`Looping entry #${i} : ${ap.name} (${ap.url})`)
      if (i < 6) {
        console.log('-- New Page --'); const _p = await b.newPage(); await _p.goto(ap.url, {waitUntil: 'networkidle0'})
        const _d = await _p.evaluate(() => {return {
            englishName: [...document.querySelectorAll('.spaceit_pad')][0].innerText.replace('English: ', ''),
            japaneseName: [...document.querySelectorAll('.spaceit_pad')][2].innerText.replace('Japanese: ', ''),
          }});
        data[ap.name.replace(/[^a-z0-9"<>#%{}|\\^~\[\]`;?:@=&_\-]/gi, '_').replace(/_{2,}/g, '_').toLowerCase()] = _d;
        await _p.close(); console.log('-- Page Closed --')
      }
    }

    console.log('Final DATA', data);


    console.log('Closing Browser');
    await b.close();
    // Make sure to close or it will be open forever
  } catch (e) {
    // Close on errors
    await b.close();
    throw new Error(e);
  }
})();
