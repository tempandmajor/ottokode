# SSL Certificates

Place your SSL certificates in this directory:

## Required Files:
- `server.crt` - SSL certificate file
- `server.key` - Private key file
- `ca-bundle.crt` - Certificate authority bundle (optional)

## Getting SSL Certificates:

### Option 1: Let's Encrypt (Free)
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/server.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/server.key
```

### Option 2: Commercial Certificate
1. Purchase SSL certificate from provider (GoDaddy, Namecheap, etc.)
2. Download certificate files
3. Rename and place:
   - Certificate file → `server.crt`
   - Private key file → `server.key`

## Security Notes:
- Keep private keys secure and never commit to version control
- Set proper file permissions: `chmod 600 server.key`
- Regularly renew certificates before expiry