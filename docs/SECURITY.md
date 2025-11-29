# Budget App - Security Best Practices

Security guidelines and best practices for Budget App deployment.

## Security Layers

1. **Network Security** - Firewall, Cloudflare
2. **Application Security** - Authentication, authorization, input validation
3. **Infrastructure Security** - VM hardening, Docker security
4. **Data Security** - Encryption, backups
5. **Access Control** - SSH, secrets management

## Network Security

### Firewall (UFW)

**Status:**
```bash
sudo ufw status
```

**Required Rules:**
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**Block Everything Else:**
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### Fail2ban

**Status:**
```bash
sudo systemctl status fail2ban
```

**Check Banned IPs:**
```bash
sudo fail2ban-client status sshd
```

**Unban IP:**
```bash
sudo fail2ban-client set sshd unbanip <IP_ADDRESS>
```

### Cloudflare Protection

- ✅ DDoS protection (automatic)
- ✅ WAF (Web Application Firewall)
- ✅ Rate limiting
- ✅ Bot protection
- ✅ SSL/TLS encryption

**Enable Additional Protection:**
1. Go to Cloudflare Dashboard
2. Security → Settings
3. Enable "Bot Fight Mode"
4. Set Security Level to "High"

## SSH Security

### Key-Based Authentication (Recommended)

**Generate SSH Key:**
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**Copy to VM:**
```bash
ssh-copy-id obiwan@4.210.196.73
```

**Disable Password Authentication:**
```bash
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### SSH Hardening

Edit `/etc/ssh/sshd_config`:

```bash
# Disable root login
PermitRootLogin no

# Use key-based auth only
PasswordAuthentication no
PubkeyAuthentication yes

# Limit users
AllowUsers obiwan

# Change default port (optional)
Port 2222

# Disable empty passwords
PermitEmptyPasswords no

# Limit authentication attempts
MaxAuthTries 3

# Set idle timeout
ClientAliveInterval 300
ClientAliveCountMax 2
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

## Application Security

### Environment Variables

**Never commit secrets:**
```bash
# .gitignore should include:
.env
.env.local
.env.production
*.pem
*.key
```

**Use strong passwords:**
```bash
# Generate strong password
openssl rand -base64 32
```

**Required secrets:**
- `DB_PASSWORD` - Database password (16+ characters)
- `JWT_SECRET` - JWT signing key (32+ characters)
- `GEMINI_API_KEY` - API key (if using AI features)

### CORS Configuration

**Restrict origins:**
```javascript
// backend/server.js
const allowedOrigins = [
  'https://budgetapp.site',
  'https://test.budgetapp.site'
];
```

**Never use:**
```javascript
// DON'T DO THIS
origin: '*'  // Allows all origins
```

### Rate Limiting

**Nginx rate limits:**
```nginx
# nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
```

**Backend rate limits:**
```javascript
// backend/server.js
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100
});
```

### Input Validation

**Always validate user input:**
```javascript
// Example
const { body, validationResult } = require('express-validator');

router.post('/api/transactions',
  body('amount').isNumeric(),
  body('description').trim().isLength({ min: 1, max: 255 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

### SQL Injection Prevention

**Use parameterized queries:**
```javascript
// GOOD
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// BAD - Never do this
const result = await pool.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

### XSS Prevention

**Sanitize output:**
```javascript
// Use helmet for security headers
app.use(helmet());

// Escape user input in frontend
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirty);
```

## Docker Security

### Run as Non-Root User

**Backend Dockerfile:**
```dockerfile
# Create non-root user
RUN addgroup --system nodejs && adduser --system --ingroup nodejs nodejs
USER nodejs
```

**Frontend Dockerfile:**
```dockerfile
USER node
```

### Limit Container Resources

**docker-compose.yml:**
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          memory: 256M
```

### Scan Images for Vulnerabilities

```bash
# Install trivy
sudo apt-get install trivy

# Scan images
trivy image budget_backend:latest
trivy image budget_frontend:latest
```

### Keep Images Updated

```bash
# Update base images regularly
docker-compose pull
docker-compose build --no-cache
docker-compose up -d
```

## Database Security

### Strong Passwords

```bash
# Generate strong database password
openssl rand -base64 32
```

### Network Isolation

**Database only accessible from backend:**
```yaml
# docker-compose.yml
services:
  database:
    networks:
      - budget_network
    # No ports exposed to host
```

### Regular Backups

```bash
# Automated daily backups
crontab -l | grep backup-database.sh
```

### Encrypt Backups (Optional)

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

## Secrets Management

### GitHub Secrets

**Never commit:**
- Passwords
- API keys
- Private keys
- Certificates

**Use GitHub Secrets:**
1. Go to repo Settings → Secrets
2. Add secrets:
   - `PROD_VM_PASSWORD`
   - `TEST_VM_PASSWORD`
   - etc.

### Environment Files

**Production .env:**
```bash
# Store securely on VM
chmod 600 .env
chown obiwan:obiwan .env
```

**Never in git:**
```bash
# .gitignore
.env*
!.env.example
```

## Monitoring & Logging

### Log Security Events

**Monitor failed logins:**
```bash
sudo grep "Failed password" /var/log/auth.log
```

**Monitor sudo usage:**
```bash
sudo grep "sudo" /var/log/auth.log
```

**Monitor Docker events:**
```bash
docker events --filter 'type=container'
```

### Regular Security Audits

**Check for updates:**
```bash
sudo apt update
sudo apt list --upgradable
```

**Check open ports:**
```bash
sudo netstat -tulpn
```

**Check running processes:**
```bash
ps aux | grep -v "\[" | sort -k3 -rn | head -10
```

## Incident Response

### If Compromised

1. **Isolate:**
   ```bash
   # Block all traffic
   sudo ufw deny from any to any
   ```

2. **Investigate:**
   ```bash
   # Check logs
   sudo grep "Failed password" /var/log/auth.log
   docker-compose logs
   ```

3. **Rotate Secrets:**
   - Change all passwords
   - Regenerate JWT secrets
   - Update GitHub secrets

4. **Restore:**
   ```bash
   # Restore from backup
   ./scripts/restore-database.sh
   ```

5. **Harden:**
   - Review security settings
   - Update all software
   - Enable additional monitoring

## Security Checklist

### Initial Setup

- [ ] Configure firewall (UFW)
- [ ] Install fail2ban
- [ ] Disable SSH password auth
- [ ] Set up SSH keys
- [ ] Generate strong passwords
- [ ] Configure Cloudflare
- [ ] Enable HTTPS

### Regular Maintenance

- [ ] Update system packages (weekly)
- [ ] Update Docker images (monthly)
- [ ] Review access logs (daily)
- [ ] Check for failed login attempts (daily)
- [ ] Rotate passwords (quarterly)
- [ ] Test backup restoration (monthly)
- [ ] Security audit (quarterly)

### Before Production

- [ ] All secrets in GitHub Secrets
- [ ] No secrets in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] HTTPS enforced
- [ ] Backups automated
- [ ] Monitoring enabled

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Nginx Security](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email: security@budgetapp.site
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Compliance

### Data Protection

- User passwords are hashed (bcrypt)
- Sensitive data encrypted in transit (HTTPS)
- Regular backups
- Access logs maintained

### GDPR Considerations

- User data deletion capability
- Data export functionality
- Privacy policy
- Cookie consent

