# Azure Portal ile VM Oluşturma Rehberi

Bu rehber, Azure Portal kullanarak Budget App için gerekli VM'leri manuel olarak oluşturmanız için adım adım talimatlar içerir.

## Seçenek 1: Azure CLI (Önerilen - Otomatik)

```bash
# Script'i çalıştırılabilir yap
chmod +x infrastructure/azure/create-vms.sh

# Script'i çalıştır
./infrastructure/azure/create-vms.sh
```

Script otomatik olarak her şeyi oluşturacak ve size IP adreslerini verecek.

---

## Seçenek 2: Azure Portal (Manuel)

### Ön Hazırlık

1. Azure Portal'a giriş yapın: https://portal.azure.com
2. Subscription'ınızın aktif olduğundan emin olun

---

## Production VM Oluşturma

### 1. Resource Group Oluştur

1. Azure Portal'da "Resource groups" ara
2. "+ Create" butonuna tıkla
3. Bilgileri gir:
   - **Subscription:** Subscription'ınızı seçin
   - **Resource group:** `rg-budget-app-prod`
   - **Region:** `East US` (veya size yakın bölge)
4. **Tags** sekmesine geç:
   - Name: `environment`, Value: `production`
   - Name: `project`, Value: `budget-app`
5. "Review + create" → "Create"

### 2. Virtual Machine Oluştur

1. Azure Portal'da "Virtual machines" ara
2. "+ Create" → "Azure virtual machine"

#### Basics Tab:
- **Subscription:** Subscription'ınızı seçin
- **Resource group:** `rg-budget-app-prod`
- **Virtual machine name:** `vm-budget-prod`
- **Region:** `East US` (Resource group ile aynı)
- **Availability options:** No infrastructure redundancy required
- **Security type:** Standard
- **Image:** Ubuntu Server 22.04 LTS - x64 Gen2
- **Size:** Standard_B2s (2 vcpus, 4 GiB memory)
  - "See all sizes" tıklayıp B2s'i bulun
- **Authentication type:** SSH public key
- **Username:** `azureuser`
- **SSH public key source:** Generate new key pair
- **Key pair name:** `vm-budget-prod_key`
- **Public inbound ports:** Allow selected ports
- **Select inbound ports:** SSH (22), HTTP (80), HTTPS (443)

#### Disks Tab:
- **OS disk type:** Premium SSD (locally-redundant storage)
- **OS disk size:** 64 GiB
- **Delete with VM:** ✓ (checked)

#### Networking Tab:
- **Virtual network:** (Create new) `vnet-budget-prod`
- **Subnet:** (default) 10.0.0.0/24
- **Public IP:** (Create new) `pip-budget-prod`
- **NIC network security group:** Basic
- **Public inbound ports:** Allow selected ports
- **Select inbound ports:** SSH (22), HTTP (80), HTTPS (443)
- **Delete public IP and NIC when VM is deleted:** ✓ (checked)

#### Management Tab:
- **Enable auto-shutdown:** No (veya istediğiniz saatte)
- **Boot diagnostics:** Enable with managed storage account

#### Monitoring Tab:
- **Enable OS guest diagnostics:** No (maliyet için)

#### Advanced Tab:
- Varsayılan ayarları bırakın

#### Tags Tab:
- Name: `environment`, Value: `production`
- Name: `project`, Value: `budget-app`

3. "Review + create" → "Create"
4. **ÖNEMLİ:** SSH key'i indirin ve güvenli bir yere kaydedin!
   - Dosya adı: `vm-budget-prod_key.pem`
   - Bu key'i kaybederseniz VM'e erişemezsiniz!

### 3. Static IP Yapılandır

1. VM oluşturulduktan sonra, VM'in sayfasına gidin
2. Sol menüden "Networking" → "Network settings"
3. Public IP adresine tıklayın (`pip-budget-prod`)
4. "Configuration" sekmesine gidin
5. **Assignment:** Static olarak değiştirin
6. "Save"

### 4. Public IP'yi Kaydet

1. VM'in "Overview" sayfasında Public IP adresini kopyalayın
2. Bu IP'yi bir yere not edin (GitHub Secrets'a ekleyeceğiz)

---

## Test VM Oluşturma

Aynı adımları tekrarlayın, ancak şu değişikliklerle:

### Resource Group:
- **Name:** `rg-budget-app-test`
- **Tags:** environment=`test`, project=`budget-app`

### Virtual Machine:
- **Resource group:** `rg-budget-app-test`
- **Name:** `vm-budget-test`
- **Size:** Standard_B1ms (1 vcpu, 2 GiB memory) - **Daha küçük ve ucuz**
- **Key pair name:** `vm-budget-test_key`
- **Virtual network:** `vnet-budget-test`
- **Public IP:** `pip-budget-test`
- **OS disk size:** 32 GiB - **Daha küçük**
- **OS disk type:** Standard SSD - **Daha ucuz**
- **Tags:** environment=`test`, project=`budget-app`

---

## SSH Key'leri Hazırlama

### İndirilen Key'leri Kullanma

```bash
# Key dosyalarını ~/.ssh/ klasörüne taşı
mv ~/Downloads/vm-budget-prod_key.pem ~/.ssh/
mv ~/Downloads/vm-budget-test_key.pem ~/.ssh/

# Doğru izinleri ayarla
chmod 600 ~/.ssh/vm-budget-prod_key.pem
chmod 600 ~/.ssh/vm-budget-test_key.pem

# Test et
ssh -i ~/.ssh/vm-budget-prod_key.pem azureuser@<PROD_PUBLIC_IP>
ssh -i ~/.ssh/vm-budget-test_key.pem azureuser@<TEST_PUBLIC_IP>
```

### SSH Config Dosyası (Opsiyonel - Kolaylık için)

`~/.ssh/config` dosyasını düzenleyin:

```
# Budget App Production VM
Host budget-prod
    HostName <PROD_PUBLIC_IP>
    User azureuser
    IdentityFile ~/.ssh/vm-budget-prod_key.pem
    StrictHostKeyChecking no

# Budget App Test VM
Host budget-test
    HostName <TEST_PUBLIC_IP>
    User azureuser
    IdentityFile ~/.ssh/vm-budget-test_key.pem
    StrictHostKeyChecking no
```

Artık basitçe bağlanabilirsiniz:
```bash
ssh budget-prod
ssh budget-test
```

---

## Doğrulama

Her iki VM için de:

```bash
# SSH bağlantısını test et
ssh -i ~/.ssh/vm-budget-prod_key.pem azureuser@<PROD_IP>

# VM içinde:
# Ubuntu versiyonunu kontrol et
lsb_release -a
# Çıktı: Ubuntu 22.04 LTS olmalı

# Disk alanını kontrol et
df -h
# Çıktı: Production için ~64GB, Test için ~32GB olmalı

# Çıkış
exit
```

---

## Maliyet Tahmini

### Production VM (Standard_B2s):
- VM: ~$30-35/ay
- Disk (64GB Premium SSD): ~$10/ay
- Public IP: ~$3/ay
- **Toplam: ~$43-48/ay**

### Test VM (Standard_B1ms):
- VM: ~$15-18/ay
- Disk (32GB Standard SSD): ~$2.5/ay
- Public IP: ~$3/ay
- **Toplam: ~$20-24/ay**

### Genel Toplam: ~$63-72/ay

### Maliyet Optimizasyonu:
- Test VM'i kullanılmadığında kapatın: `az vm deallocate`
- Hafta sonları test VM'i kapatın: ~$8-10/ay tasarruf
- Geliştirme saatleri dışında test VM'i kapatın: ~$12-15/ay tasarruf

---

## Sonraki Adımlar

✅ VM'ler oluşturuldu
✅ SSH erişimi test edildi
✅ IP adresleri kaydedildi

**Şimdi:**
1. ✅ Task 1 tamamlandı olarak işaretle
2. ➡️ Task 2'ye geç: VM Initial Setup (Docker, firewall, vb.)

---

## Sorun Giderme

### SSH bağlantısı çalışmıyor:
```bash
# Key izinlerini kontrol et
ls -la ~/.ssh/vm-budget-*

# 600 olmalı, değilse:
chmod 600 ~/.ssh/vm-budget-prod_key.pem

# Verbose mode ile bağlan
ssh -v -i ~/.ssh/vm-budget-prod_key.pem azureuser@<IP>
```

### "Permission denied (publickey)" hatası:
- Key dosyasının doğru olduğundan emin olun
- Username'in `azureuser` olduğundan emin olun
- Azure Portal'da VM'in "Connect" bölümünden doğru komutu kopyalayın

### VM'e bağlanamıyorum:
- NSG kurallarının doğru olduğunu kontrol edin (port 22 açık mı?)
- Public IP'nin doğru olduğunu kontrol edin
- VM'in çalıştığını kontrol edin (Azure Portal'da "Running" durumunda mı?)

---

## Temizleme (İhtiyaç Halinde)

Tüm kaynakları silmek için:

```bash
# Production'ı sil
az group delete --name rg-budget-app-prod --yes --no-wait

# Test'i sil
az group delete --name rg-budget-app-test --yes --no-wait
```

**⚠️ DİKKAT:** Bu komut tüm kaynakları kalıcı olarak siler!
