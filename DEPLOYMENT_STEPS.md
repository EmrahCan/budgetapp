# Budget App - Deployment Steps

## 🎯 Current Status
- ✅ Task 1: VMs Created
- ➡️ Task 2: VM Initial Setup (YOU ARE HERE)

---

## 📋 Task 2: Configure VM Initial Setup

### Step 1: Connect to Test VM

```bash
ssh obiwan@108.141.152.224
# Password: Eben2010++**
```

### Step 2: Clone Repository on Test VM

```bash
# Create directory
mkdir -p ~/budget-app
cd ~/budget-app

# Clone repository
git clone https://github.com/EmrahCan/budgetapp.git .

# If repo is private, use token:
# git clone https://YOUR_TOKEN@github.com/EmrahCan/budgetapp.git .
```

### Step 3: Run Setup Script on Test VM

```bash
cd ~/budget-app

# Make script executable
chmod +x scripts/vm-setup.sh

# Run setup script
./scripts/vm-setup.sh

# When prompted, enter: test
```

**What the script does:**
- Updates system packages
- Installs Docker & Docker Compose
- Configures UFW firewall (ports 22, 80, 443)
- Sets up fail2ban
- Hardens SSH configuration
- Installs certbot for SSL

**Expected output:**
```
✅ VM setup completed successfully!
⚠️  IMPORTANT: You need to log out and log back in for Docker group changes to take effect
```

### Step 4: Log Out and Back In

```bash
exit

# Log back in
ssh obiwan@108.141.152.224
```

### Step 5: Verify Installation on Test VM

```bash
# Check Docker
docker --version
docker-compose --version

# Check firewall
sudo ufw status

# Check fail2ban
sudo systemctl status fail2ban
```

---

### Step 6: Repeat for Production VM

```bash
# Connect to Production VM
ssh obiwan@4.210.196.73
# Password: Eben2010++**

# Clone repository
mkdir -p ~/budget-app
cd ~/budget-app
git clone https://github.com/EmrahCan/budgetapp.git .

# Run setup script
chmod +x scripts/vm-setup.sh
./scripts/vm-setup.sh
# When prompted, enter: prod

# Log out and back in
exit
ssh obiwan@4.210.196.73

# Verify installation
docker --version
docker-compose --version
sudo ufw status
```

---

## ✅ Task 2 Completion Checklist

- [ ] Test VM: Script executed successfully
- [ ] Test VM: Docker installed and working
- [ ] Test VM: Firewall configured
- [ ] Test VM: fail2ban running
- [ ] Production VM: Script executed successfully
- [ ] Production VM: Docker installed and working
- [ ] Production VM: Firewall configured
- [ ] Production VM: fail2ban running

---

## 🚨 Troubleshooting

### If git clone fails:
```bash
# Option 1: Use HTTPS with token
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .

# Option 2: Upload files from local machine
# On your local machine:
cd /path/to/budget
tar -czf budget-app.tar.gz .
scp budget-app.tar.gz obiwan@108.141.152.224:~/
# Then on VM:
cd ~/budget-app
tar -xzf ~/budget-app.tar.gz
```

### If Docker permission denied:
```bash
# Log out and back in (Docker group change needs new session)
exit
ssh obiwan@108.141.152.224

# Test Docker
docker ps
```

### If firewall blocks SSH:
```bash
# Before running script, ensure SSH is allowed
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 📝 After Task 2 Completion

Tell me: **"Task 2 tamamlandı"**

Then we'll proceed to:
- Task 3-11: Already done (Docker Compose, Dockerfiles, Nginx, GitHub Actions)
- Task 12: Configure GitHub Secrets
- Task 13-19: Remaining scripts and documentation
- Task 20: Deploy to Test Environment
- Task 21: Deploy to Production

---

## 🔑 Important Notes

1. **Keep VM credentials safe** - They're in `VM_CREDENTIALS.md` (not committed to Git)
2. **SSH Keys** - We'll set up SSH keys for GitHub Actions later
3. **Environment Files** - We'll create `.env` files on VMs before deployment
4. **SSL Certificates** - We'll set up Let's Encrypt after DNS is configured

---

**Ready to start? Connect to Test VM and run the setup script!** 🚀
