# Branchcode AI Download Website

This is the official download website for Branchcode AI - an enterprise AI-powered IDE for collaborative development.

## Features

- **Responsive Design**: Works on all devices and screen sizes
- **Platform Detection**: Automatically recommends the correct download for the user's platform
- **Download Tracking**: Analytics for download events and user engagement
- **Contact Form**: Lead generation and customer inquiries
- **Modern UI**: Clean, professional design with smooth animations

## Setup

### Quick Deployment

1. Upload all files to your web server or hosting provider
2. Ensure the `downloads/` directory contains your actual application builds
3. Update contact form endpoint (see JavaScript section below)
4. Configure analytics (optional)

### File Structure

```
website/
├── index.html          # Main landing page
├── css/
│   └── style.css      # Styles and responsive design
├── js/
│   └── script.js      # Interactive functionality
├── images/            # Logo, screenshots, and assets
├── downloads/         # Application builds (add your actual files)
│   ├── Branchcode-AI-1.0.0-universal.dmg    # macOS installer
│   ├── Branchcode-AI-1.0.0-setup.exe        # Windows installer
│   ├── branchcode-ai_1.0.0_amd64.deb        # Linux DEB package
│   └── Branchcode-AI-1.0.0.AppImage         # Linux AppImage
└── README.md          # This file
```

## Configuration

### Adding Your Application Builds

1. Build your Tauri application for each platform:
   ```bash
   npm run tauri:build
   ```

2. Copy the generated files to the `downloads/` directory:
   - **macOS**: Copy the `.dmg` file from `src-tauri/target/release/bundle/dmg/`
   - **Windows**: Copy the `.exe` or `.msi` file from `src-tauri/target/release/bundle/`
   - **Linux**: Copy `.deb` and `.AppImage` files from `src-tauri/target/release/bundle/`

3. Update file sizes in `index.html` to match your actual builds

### Contact Form Integration

The contact form currently shows a demo message. To integrate with your backend:

1. Replace the setTimeout in `js/script.js` with a real API call:

```javascript
fetch('/api/contact', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
})
.then(response => response.json())
.then(result => {
    showFormSuccessMessage();
    form.reset();
})
.catch(error => {
    showFormErrorMessage();
});
```

2. Set up your backend endpoint to handle form submissions
3. Consider adding spam protection (reCAPTCHA, etc.)

### Analytics Integration

Add Google Analytics or your preferred analytics service:

1. Add the tracking script to `index.html` before closing `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

2. Replace `GA_MEASUREMENT_ID` with your actual Google Analytics ID

### Domain and Branding

Update the following in `index.html`:

- Replace `branchcode.ai` with your actual domain
- Update social media links
- Add your actual logo to `images/` directory
- Update meta tags for SEO

## Customization

### Colors and Styling

The main brand colors are defined in CSS custom properties. Update these in `css/style.css`:

```css
:root {
  --primary-color: #007acc;
  --secondary-color: #0056b3;
  --accent-color: #28a745;
}
```

### Content Updates

- **Hero Section**: Update the main headline and description
- **Features**: Modify the 6 feature cards to highlight your key benefits
- **Pricing**: Update pricing tiers and features
- **Download Links**: Ensure all download URLs point to your actual files

## SEO Optimization

### Meta Tags

The site includes comprehensive meta tags for SEO and social sharing. Update:

- Page title and description
- Open Graph images
- Keywords relevant to your product

### Performance

The site is optimized for performance with:

- Compressed images
- Minified CSS/JS (in production)
- Responsive images
- Fast loading animations

## Security Considerations

### Download Security

1. **File Integrity**: Consider adding SHA256 checksums for downloads
2. **HTTPS**: Always serve over HTTPS, especially for downloads
3. **Code Signing**: Sign your applications before distribution

### Form Security

1. **Validation**: Add server-side form validation
2. **Rate Limiting**: Prevent spam submissions
3. **CAPTCHA**: Add reCAPTCHA for additional protection

## Deployment Options

### Static Hosting

The website is a static site and can be deployed to:

- **Netlify**: Drag and drop deployment with built-in forms
- **Vercel**: Git-based deployment with edge functions
- **GitHub Pages**: Free hosting for open source projects
- **AWS S3 + CloudFront**: Scalable with global CDN
- **Traditional Hosting**: Any web hosting provider

### CDN Integration

For faster global delivery:

1. Use a CDN like CloudFlare or AWS CloudFront
2. Optimize images and enable compression
3. Set appropriate cache headers

## Monitoring

### Analytics to Track

- Download conversion rates
- Platform distribution
- Geographic usage
- Contact form submissions
- User engagement metrics

### Error Monitoring

Consider adding error tracking:

```javascript
window.addEventListener('error', function(e) {
    // Send error to monitoring service
    console.error('Website error:', e);
});
```

## Support

For questions about the website setup:

- Check the browser console for JavaScript errors
- Validate HTML/CSS with W3C validators
- Test responsive design across devices
- Monitor Core Web Vitals for performance

## License

This website template is part of the Branchcode AI project. Customize as needed for your deployment.