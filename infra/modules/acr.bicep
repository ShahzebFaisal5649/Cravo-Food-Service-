param location string
param acrName string
param acrSku string = 'Basic'

resource acr 'Microsoft.ContainerRegistry/registries@2025-04-01' = {
  name: acrName
  location: location

  sku: {
    name: acrSku
  }

  properties: {
    adminUserEnabled: false
    dataEndpointEnabled: false
    encryption: {
      status: 'disabled'
    }
  }
}

output acrId string = acr.id
output loginServer string = acr.properties.loginServer
