targetScope = 'resourceGroup'

param location string = resourceGroup().location

param vnetName string = 'vnet-cravo-devops'

param acrName string = 'acrcravodevops'
param acrSku string = 'Basic'

param sshSourceIp string

param backendVmName string = 'vm-cravo-backend'
param frontendVmName string = 'vm-cravo-frontend'

param backendPrivateIp string = '10.0.1.4'
param frontendPrivateIp string = '10.0.2.4'

resource frontendPublicIp 'Microsoft.Network/publicIPAddresses@2024-05-01' existing = {
  name: 'vm-cravo-frontend-pip'
}

module network './modules/network.bicep' = {
  name: 'cravo-network'

  params: {
    location: location
    vnetName: vnetName
    sshSourceIp: sshSourceIp
  }
}

module acr './modules/acr.bicep' = {
  name: 'cravo-acr'

  params: {
    location: location
    acrName: acrName
    acrSku: acrSku
  }
}

module backendVm './modules/backend-vm.bicep' = {
  name: 'cravo-backend-vm'

  params: {
    location: location
    vmName: backendVmName
    vmSize: 'Standard_B2als_v2'
    adminUsername: 'azureuser'
    subnetId: network.outputs.backendSubnetId
    nsgId: network.outputs.backendNsgId
    privateIp: backendPrivateIp
  }
}

module frontendVm './modules/frontend-vm.bicep' = {
  name: 'cravo-frontend-vm'

  params: {
    location: location
    vmName: frontendVmName
    vmSize: 'Standard_B2als_v2'
    adminUsername: 'azureuser'
    subnetId: network.outputs.frontendSubnetId
    nsgId: network.outputs.frontendNsgId
    publicIpId: frontendPublicIp.id
    privateIp: frontendPrivateIp
  }
}
