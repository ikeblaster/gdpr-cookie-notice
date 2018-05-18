GDPR Cookie Notice
=============

This is a javascript solution to show a gdpr compliant cookie notice on your website.

##### Demo

Check this site for a quick demo: https://passatgt.github.io/gdpr-cookie-notice/

##### How it works?

Include the scripts.js and style.css files on your site from the dist folder. Init the script with the following config file:

```
gdprCookieNotice({
  locale: 'cs', //This is the default value
  timeout: 300, //Time until the cookie bar appears
  expiration: 90, //This is the default value, in days
  domain: '.yoursite.com', //If you run the same cookie notice on all subdomains, define the main domain starting with a .
  statement: 'https://google.com', //Link to your cookie statement page
  categories: {
    essential: true, // always true
    analytics: true, // always true
    social: [],
    marketing: [],
  }
});
```

User will see a banner at the bottom of the screen, describing why the site runs cookies. Clicking on Cookie settings will let the user select which type of cookies they might allow on the site(if something is not allowed, all cookies defined in the config file will be deleted automatically on page load). The bar will be visible always if they don't allow all types of cookies to load, just to annoy them a little.

You can use listen to the gdprCookiesEnabled event to load scripts on your site only when the cookies are enabled by the user.
