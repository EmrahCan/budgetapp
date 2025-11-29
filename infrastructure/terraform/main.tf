# Budget App - Azure Infrastructure with Terraform
# This creates 2 VMs (test and production) with all necessary resources

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Variables
variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "admin_username" {
  description = "Admin username for VMs"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# Production Environment
resource "azurerm_resource_group" "prod" {
  name     = "rg-budget-app-prod"
  location = var.location

  tags = {
    environment = "production"
    project     = "budget-app"
  }
}

resource "azurerm_virtual_network" "prod" {
  name                = "vnet-budget-prod"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.prod.location
  resource_group_name = azurerm_resource_group.prod.name

  tags = {
    environment = "production"
    project     = "budget-app"
  }
}

resource "azurerm_subnet" "prod" {
  name                 = "subnet-budget-prod"
  resource_group_name  = azurerm_resource_group.prod.name
  virtual_network_name = azurerm_virtual_network.prod.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_public_ip" "prod" {
  name                = "pip-budget-prod"
  location            = azurerm_resource_group.prod.location
  resource_group_name = azurerm_resource_group.prod.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = {
    environment = "production"
    project     = "budget-app"
  }
}

resource "azurerm_network_security_group" "prod" {
  name                = "nsg-budget-prod"
  location            = azurerm_resource_group.prod.location
  resource_group_name = azurerm_resource_group.prod.name

  security_rule {
    name                       = "SSH"
    priority                   = 1000
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    environment = "production"
    project     = "budget-app"
  }
}

resource "azurerm_network_interface" "prod" {
  name                = "nic-budget-prod"
  location            = azurerm_resource_group.prod.location
  resource_group_name = azurerm_resource_group.prod.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.prod.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.prod.id
  }

  tags = {
    environment = "production"
    project     = "budget-app"
  }
}

resource "azurerm_network_interface_security_group_association" "prod" {
  network_interface_id      = azurerm_network_interface.prod.id
  network_security_group_id = azurerm_network_security_group.prod.id
}

resource "azurerm_linux_virtual_machine" "prod" {
  name                = "vm-budget-prod"
  resource_group_name = azurerm_resource_group.prod.name
  location            = azurerm_resource_group.prod.location
  size                = "Standard_B2s"
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.prod.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 64
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  tags = {
    environment = "production"
    project     = "budget-app"
  }
}

# Test Environment
resource "azurerm_resource_group" "test" {
  name     = "rg-budget-app-test"
  location = var.location

  tags = {
    environment = "test"
    project     = "budget-app"
  }
}

resource "azurerm_virtual_network" "test" {
  name                = "vnet-budget-test"
  address_space       = ["10.1.0.0/16"]
  location            = azurerm_resource_group.test.location
  resource_group_name = azurerm_resource_group.test.name

  tags = {
    environment = "test"
    project     = "budget-app"
  }
}

resource "azurerm_subnet" "test" {
  name                 = "subnet-budget-test"
  resource_group_name  = azurerm_resource_group.test.name
  virtual_network_name = azurerm_virtual_network.test.name
  address_prefixes     = ["10.1.1.0/24"]
}

resource "azurerm_public_ip" "test" {
  name                = "pip-budget-test"
  location            = azurerm_resource_group.test.location
  resource_group_name = azurerm_resource_group.test.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = {
    environment = "test"
    project     = "budget-app"
  }
}

resource "azurerm_network_security_group" "test" {
  name                = "nsg-budget-test"
  location            = azurerm_resource_group.test.location
  resource_group_name = azurerm_resource_group.test.name

  security_rule {
    name                       = "SSH"
    priority                   = 1000
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    environment = "test"
    project     = "budget-app"
  }
}

resource "azurerm_network_interface" "test" {
  name                = "nic-budget-test"
  location            = azurerm_resource_group.test.location
  resource_group_name = azurerm_resource_group.test.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.test.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.test.id
  }

  tags = {
    environment = "test"
    project     = "budget-app"
  }
}

resource "azurerm_network_interface_security_group_association" "test" {
  network_interface_id      = azurerm_network_interface.test.id
  network_security_group_id = azurerm_network_security_group.test.id
}

resource "azurerm_linux_virtual_machine" "test" {
  name                = "vm-budget-test"
  resource_group_name = azurerm_resource_group.test.name
  location            = azurerm_resource_group.test.location
  size                = "Standard_B1ms"
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.test.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 32
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  tags = {
    environment = "test"
    project     = "budget-app"
  }
}

# Outputs
output "production_public_ip" {
  value       = azurerm_public_ip.prod.ip_address
  description = "Production VM public IP address"
}

output "test_public_ip" {
  value       = azurerm_public_ip.test.ip_address
  description = "Test VM public IP address"
}

output "production_ssh_command" {
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.prod.ip_address}"
  description = "SSH command for production VM"
}

output "test_ssh_command" {
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.test.ip_address}"
  description = "SSH command for test VM"
}
