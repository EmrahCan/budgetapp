#!/bin/bash
# Budget App - VM Initial Setup Script
# Run this script on each VM after creation to install and configure all necessary software

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Budget App - VM Initial Setup               ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please do not run this script as root${NC}"
    echo "Run as regular user with sudo privileges"
    exit 1
fi

# Detect environment
read -p "Is this PRODUCTION or TEST environment? (prod/test): " ENV
if [[ "$ENV" != "prod" && "$ENV" != "test" ]]; then
    echo -e "${RED}❌ Invalid environment. Please enter 'prod' or 'test'${NC}"
    exit 1
fi

echo -e "${BLUE}Setting up $ENV environment...${NC}"
echo ""

# Update system
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
echo -e "${YELLOW}[2/10] Installing essential tools...${NC}"
sudo apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools \
    ufw \
    fail2ban \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
echo -e "${YELLOW}[3/10] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    echo -e "${GREEN}✓ Docker installed successfully${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Install Docker Compose (standalone)
echo -e "${YELLOW}[4/10] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Configure UFW Firewall
echo -e "${YELLOW}[5/10] Configuring UFW firewall...${NC}"
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

# Configure fail2ban
echo -e "${YELLOW}[6/10] Configuring fail2ban...${NC}"
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create fail2ban SSH jail
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 600
findtime = 600
maxretry = 5
destemail = root@localhost
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
EOF

sudo systemctl restart fail2ban
echo -e "${GREEN}✓ fail2ban configured${NC}"

# Disable password authentication for SSH
echo -e "${YELLOW}[7/10] Hardening SSH configuration...${NC}"
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
echo -e "${GREEN}✓ SSH hardened (password auth disabled, root login disabled)${NC}"

# Configure automatic security updates
echo -e "${YELLOW}[8/10] Configuring automatic security updates...${NC}"
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
echo -e "${GREEN}✓ Automatic security updates enabled${NC}"

# Create application directory
echo -e "${YELLOW}[9/10] Creating application directory...${NC}"
mkdir -p ~/budget-app
cd ~/budget-app

# Create necessary subdirectories
mkdir -p logs backups nginx/ssl nginx/logs

echo -e "${GREEN}✓ Application directory created at ~/budget-app${NC}"

# Install certbot for SSL certificates
echo -e "${YELLOW}[10/10] Installing certbot for SSL certificates...${NC}"
sudo apt-get install -y certbot
echo -e "${GREEN}✓ Certbot installed${NC}"

# Display versions
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Installation Complete!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo "Installed versions:"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker-compose --version)"
echo "  Git: $(git --version)"
echo "  Certbot: $(certbot --version)"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You need to log out and log back in for Docker group changes to take effect${NC}"
echo ""
echo "Next steps:"
echo "1. Log out: exit"
echo "2. Log back in: ssh $USER@$(hostname -I | awk '{print $1}')"
echo "3. Clone repository: cd ~/budget-app && git clone <your-repo-url> ."
echo "4. Create .env file with environment variables"
echo "5. Run: docker-compose up -d"
echo ""
echo -e "${GREEN}✅ VM setup completed successfully!${NC}"
