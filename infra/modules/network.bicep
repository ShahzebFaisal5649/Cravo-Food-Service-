param location string
param vnetName string
param addressPrefix string = '10.0.0.0/16'
param backendSubnetPrefix string = '10.0.1.0/24'
param frontendSubnetPrefix string = '10.0.2.0/24'

param sshSourceIp string

resource backendNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'nsg-cravo-backend'
  location: location

  properties: {
    securityRules: [
      {
        name: 'Allow-HTTP'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationPortRange: '80'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'Allow-HTTPS'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationPortRange: '443'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'Allow-Frontend-Backend'
        properties: {
          priority: 120
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: frontendSubnetPrefix
          destinationPortRange: '5000'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'Allow-Mongo-BackendSubnet'
        properties: {
          priority: 130
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: backendSubnetPrefix
          destinationPortRange: '27017'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

resource frontendNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'nsg-cravo-frontend'
  location: location

  properties: {
    securityRules: [
      {
        name: 'Allow-HTTP'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationPortRange: '80'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'Allow-HTTPS'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '*'
          destinationPortRange: '443'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'Allow-SSH-MyIP'
        properties: {
          priority: 130
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '${sshSourceIp}/32'
          destinationPortRange: '22'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

resource agentNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'vm-cravo-agentNSG'
  location: location

  properties: {
    securityRules: [
      {
        name: 'default-allow-ssh'
        properties: {
          priority: 1000
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: '${sshSourceIp}/32'
          destinationPortRange: '22'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: vnetName
  location: location

  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }

    privateEndpointVNetPolicies: 'Disabled'

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

output backendNsgId string = backendNsg.id
output frontendNsgId string = frontendNsg.id
output agentNsgId string = agentNsg.id
