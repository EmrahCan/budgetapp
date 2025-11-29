# Terraform Infrastructure Setup

Bu klasör, Budget App için Azure altyapısını Terraform ile oluşturmak için gerekli dosyaları içerir.

## Ön Gereksinimler

1. **Terraform yükleyin:**
   ```bash
   # macOS
   brew install terraform
   
   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **Azure CLI yükleyin ve login olun:**
   ```bash
   az login
   ```

3. **SSH key oluşturun (yoksa):**
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   ```

## Kullanım

### 1. Terraform'u başlat:
```bash
cd infrastructure/terraform
terraform init
```

### 2. Plan'ı görüntüle:
```bash
terraform plan
```

### 3. Altyapıyı oluştur:
```bash
terraform apply
```

Onay için `yes` yazın.

### 4. Output'ları görüntüle:
```bash
terraform output
```

Çıktı:
```
production_public_ip = "20.X.X.X"
production_ssh_command = "ssh azureuser@20.X.X.X"
test_public_ip = "20.Y.Y.Y"
test_ssh_command = "ssh azureuser@20.Y.Y.Y"
```

## Özelleştirme

`terraform.tfvars` dosyası oluşturarak değişkenleri özelleştirebilirsiniz:

```hcl
location            = "westeurope"
admin_username      = "myuser"
ssh_public_key_path = "~/.ssh/my_key.pub"
```

## Altyapıyı Silme

```bash
terraform destroy
```

**⚠️ DİKKAT:** Bu komut tüm kaynakları kalıcı olarak siler!

## State Yönetimi

Terraform state dosyası (`terraform.tfstate`) önemlidir ve güvenli bir yerde saklanmalıdır.

**Üretim için:** Azure Storage'da remote state kullanın:

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstatebudgetapp"
    container_name       = "tfstate"
    key                  = "budget-app.tfstate"
  }
}
```

## Avantajlar

- ✅ Infrastructure as Code
- ✅ Tekrarlanabilir
- ✅ Version control
- ✅ Otomatik dependency yönetimi
- ✅ Plan önizlemesi
- ✅ Kolay cleanup
