#!/bin/bash

# ─────────────────────────────────────────────
#  Admin Panel Deploy Script
#  EC2: 54.196.60.160 (Mastery-Frontend)
#  Deploys to: http://54.196.60.160:8080
# ─────────────────────────────────────────────

set -e

EC2_IP="54.196.60.160"
EC2_USER="ubuntu"          # change to ec2-user if Amazon Linux
PEM_FILE="./Mastery-Frontend.pem"
REMOTE_ADMIN_DIR="/var/www/admin"
BUILD_DIR="./dist"
SSH="ssh -i $PEM_FILE -o StrictHostKeyChecking=no"

echo "──────────────────────────────────────────"
echo " Step 1: Building admin panel..."
echo "──────────────────────────────────────────"
npm run build

echo ""
echo "──────────────────────────────────────────"
echo " Step 2: Preparing remote directory..."
echo "──────────────────────────────────────────"
$SSH "$EC2_USER@$EC2_IP" \
  "sudo mkdir -p $REMOTE_ADMIN_DIR && sudo chown -R \$USER:\$USER $REMOTE_ADMIN_DIR"

echo ""
echo "──────────────────────────────────────────"
echo " Step 3: Uploading build files..."
echo "──────────────────────────────────────────"
rsync -avz --delete -e "ssh -i $PEM_FILE -o StrictHostKeyChecking=no" \
  "$BUILD_DIR/" "$EC2_USER@$EC2_IP:$REMOTE_ADMIN_DIR/"

echo ""
echo "──────────────────────────────────────────"
echo " Step 4: Configuring Nginx on port 8080..."
echo "──────────────────────────────────────────"

$SSH "$EC2_USER@$EC2_IP" bash << 'ENDSSH'
set -e

CONF="/etc/nginx/sites-available/admin-8080"

# Write a dedicated nginx server block for port 8080
sudo tee "$CONF" > /dev/null << 'NGINXEOF'
server {
    listen 8080;
    server_name admin.evanstrainer.com;

    root /var/www/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

# Enable the site
sudo ln -sf "$CONF" /etc/nginx/sites-enabled/admin-8080

echo "  Testing nginx config..."
sudo nginx -t

echo "  Reloading nginx..."
sudo systemctl reload nginx

echo "  Done."
ENDSSH

echo ""
echo "──────────────────────────────────────────"
echo " Step 5: Installing SSL certificate..."
echo "──────────────────────────────────────────"

$SSH "$EC2_USER@$EC2_IP" bash << 'ENDSSH'
set -e

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
  echo "  Installing certbot..."
  sudo apt-get update -qq
  sudo apt-get install -y certbot python3-certbot-nginx
else
  echo "  Certbot already installed."
fi

# Obtain and install certificate (nginx plugin handles config automatically)
echo "  Requesting SSL certificate for admin.evanstrainer.com..."
sudo certbot --nginx \
  -d admin.evanstrainer.com \
  --non-interactive \
  --agree-tos \
  --email govind@agientix.ai \
  --redirect

echo "  SSL certificate installed."
ENDSSH

echo ""
echo "══════════════════════════════════════════"
echo "  Deploy complete!"
echo "  Admin panel: https://admin.evanstrainer.com"
echo ""
echo "  IMPORTANT: Make sure these ports are open"
echo "  in your EC2 Security Group inbound rules:"
echo "    - Port 80  (HTTP  - for cert renewal)"
echo "    - Port 443 (HTTPS - for the admin panel)"
echo "    - Port 8080 (if you still need direct IP access)"
echo "══════════════════════════════════════════"
