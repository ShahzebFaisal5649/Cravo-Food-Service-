param location string
param vnetName string
param addressPrefix string = '10.0.0.0/16'
param backendSubnetPrefix string = '10.0.1.0/24'
param frontendSubnetPrefix string = '10.0.2.0/24'

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: vnetName
  location: location

  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }

    subnets: [
      {
        name: 'backend-subnet'

        properties: {
          addressPrefix: backendSubnetPrefix
        }
      }

      {
        name: 'frontend-subnet'

        properties: {
          addressPrefix: frontendSubnetPrefix
        }
      }
    ]
  }
}

output backendSubnetId string = resourceId(
  'Microsoft.Network/virtualNetworks/subnets',
  vnetName,
  'backend-subnet'
)

output frontendSubnetId string = resourceId(
  'Microsoft.Network/virtualNetworks/subnets',
  vnetName,
  'frontend-subnet'
)