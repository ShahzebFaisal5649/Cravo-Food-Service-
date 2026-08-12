targetScope = 'resourceGroup'

param location string = resourceGroup().location

param vnetName string = 'vnet-cravo-devops'

module network './modules/network.bicep' = {
  name: 'cravo-network'
  params: {
    location: location
    vnetName: vnetName
  }
}