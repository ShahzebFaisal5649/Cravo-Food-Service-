# CRAVO — Azure DevOps & Cloud Infrastructure

> **Final Azure Cloud Deployment — 18 August 2026**

Cravo is a food-service application deployed on **Microsoft Azure** using Infrastructure as Code, Docker, Azure Container Registry, Azure Key Vault, Managed Identity, Nginx, and Azure DevOps.

The final deployment uses a secure two-tier architecture in which the **frontend is publicly accessible**, while the **backend and database remain inside the private Azure network**.

---

## Project Status

**Status: COMPLETE**

The core Cravo Azure infrastructure and application deployment has been successfully implemented and validated.

### Completed

* Azure infrastructure provisioning
* Bicep Infrastructure as Code
* Azure Virtual Network
* Frontend and backend subnet separation
* Network Security Groups
* Frontend Azure VM
* Private backend Azure VM
* Docker Engine
* Dockerized Node.js/Express backend
* Dockerized MongoDB
* Dedicated Docker network
* Azure Container Registry
* Azure Managed Identity
* ACR `AcrPull`
* Azure Key Vault
* Backend secret retrieval
* Nginx frontend hosting
* Nginx `/api/` reverse proxy
* React/Vite production deployment
* Frontend deployment backup/rollback
* Backend health validation
* Application API validation
* Azure DevOps source control
* Self-hosted Azure DevOps agent
* Workload Identity Federation service connection
* Final Git commit synchronization

---

# 1. Architecture

```text
                         USERS
                           |
                           v
                  PUBLIC INTERNET
                           |
                           v
              +-------------------------+
              |     FRONTEND VM         |
              |   vm-cravo-frontend     |
              |                         |
              |   Ubuntu 24.04         |
              |   Nginx                 |
              |   React/Vite            |
              +------------+------------+
                           |
                         /api/
                           |
                           v
                 AZURE PRIVATE NETWORK
                           |
                           v
              +-------------------------+
              |      BACKEND VM         |
              |   vm-cravo-backend      |
              |   10.0.1.4              |
              |                         |
              |   Ubuntu 24.04          |
              |   Docker                |
              |                         |
              |   Node/Express :5000   |
              |   MongoDB :27017        |
              +------------+------------+
                           |
              +------------+-------------+
              |                          |
              v                          v
       Azure Key Vault          Azure Container Registry
```

## Architecture Principles

The deployment follows these principles:

* Public traffic enters through the frontend VM.
* Nginx serves the React/Vite frontend.
* Nginx forwards `/api/` requests to the private backend.
* The backend VM has no public IP.
* MongoDB is not publicly exposed.
* Docker isolates the backend and database services.
* Azure Key Vault stores application secrets.
* Managed Identity provides passwordless Azure authentication.
* Azure Container Registry stores production container images.
* Azure DevOps manages the source repository and deployment foundation.

---

# 2. Technology Stack

## Application

| Component        | Technology        |
| ---------------- | ----------------- |
| Frontend         | React / Vite      |
| Backend          | Node.js / Express |
| Database         | MongoDB           |
| Containerization | Docker            |
| Web Server       | Nginx             |

## Azure

| Service                  | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| Azure Virtual Network    | Private networking                       |
| Azure VM                 | Application compute                      |
| Azure Container Registry | Docker image storage                     |
| Azure Key Vault          | Secret management                        |
| Managed Identity         | Passwordless Azure authentication        |
| Network Security Groups  | Network access control                   |
| Azure DevOps             | Source control and deployment foundation |
| Azure Bicep              | Infrastructure as Code                   |

---

# 3. Azure Environment

## Resource Group

```text
rg-cravo-devops
```

## Region

```text
Sweden Central
```

## Virtual Network

```text
vnet-cravo-devops
10.0.0.0/16
```

## Backend Subnet

```text
10.0.1.0/24
```

Backend VM:

```text
vm-cravo-backend
10.0.1.4
```

## Frontend Subnet

```text
10.0.2.0/24
```

Frontend VM:

```text
vm-cravo-frontend
10.0.2.4
```

Public frontend IP:

```text
4.225.205.175
```

---

# 4. Repository Structure

The project contains both application and infrastructure components.

```text
cravo/
│
├── infra/
│   ├── main.bicep
│   ├── modules/
│   │   ├── network.bicep
│   │   ├── nsg.bicep
│   │   ├── backend-vm.bicep
│   │   └── frontend-vm.bicep
│   │
│   └── parameters/
│       └── dev.bicepparam
│
├── cravo-server/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── package-lock.json
│
├── src/
│   └── frontend source files
│
├── public/
│
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

# 5. Infrastructure as Code

Azure infrastructure is defined using **Bicep**.

Main deployment file:

```text
infra/main.bicep
```

Network:

```text
infra/modules/network.bicep
```

Network Security Groups:

```text
infra/modules/nsg.bicep
```

Backend VM:

```text
infra/modules/backend-vm.bicep
```

Frontend VM:

```text
infra/modules/frontend-vm.bicep
```

Deployment parameters:

```text
infra/parameters/dev.bicepparam
```

---

# 6. Bicep Deployment

The infrastructure can be validated and deployed using Azure CLI.

### Build Bicep

```powershell
az bicep build --file infra/main.bicep
```

### Validate deployment

```powershell
az deployment group validate `
  --resource-group rg-cravo-devops `
  --parameters infra/parameters/dev.bicepparam
```

### Preview changes

```powershell
az deployment group what-if `
  --resource-group rg-cravo-devops `
  --parameters infra/parameters/dev.bicepparam
```

### Deploy

```powershell
az deployment group create `
  --resource-group rg-cravo-devops `
  --parameters infra/parameters/dev.bicepparam
```

The `what-if` operation should be used before production changes to identify unintended infrastructure modifications.

---

# 7. Backend Deployment

The backend runs on:

```text
vm-cravo-backend
```

Operating system:

```text
Ubuntu 24.04 LTS
```

VM size:

```text
Standard_B2als_v2
```

Private IP:

```text
10.0.1.4
```

Backend port:

```text
5000
```

The backend VM does not have a public IP.

---

# 8. Backend Docker Container

The backend uses Node.js 22 Alpine.

Example Dockerfile:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]
```

The production container provides:

* Node.js 22 runtime
* Express backend
* Production dependencies only
* Port 5000
* Key Vault-backed configuration
* MongoDB connectivity

---

# 9. MongoDB

MongoDB runs as a Docker container on the backend VM.

Docker network:

```text
cravo-net
```

The architecture is:

```text
Backend Container
       |
       v
   cravo-net
       |
       v
MongoDB Container
```

MongoDB is not directly exposed to the public Internet.

---

# 10. Docker

Docker Engine is installed on the backend VM.

Verified version:

```text
Docker version 29.7.2
```

Docker provides application isolation and repeatable deployment.

---

# 11. Azure Container Registry

The production backend image is stored in:

```text
acrcravodevops.azurecr.io
```

Backend image:

```text
cravo-backend:latest
```

The registry uses Azure RBAC.

The ACR admin user is disabled.

The backend VM's Managed Identity has:

```text
AcrPull
```

permission.

Deployment flow:

```text
Developer
    |
    v
Docker Build
    |
    v
Azure Container Registry
    |
    v
Managed Identity
    |
    v
Backend VM
    |
    v
Docker Container
```

---

# 12. Azure Managed Identity

The backend VM uses a system-assigned Managed Identity.

This identity provides access to Azure services without storing long-lived credentials on the VM.

The identity is used for:

* Azure Container Registry
* Azure Key Vault

This improves security and reduces credential-management overhead.

---

# 13. Azure Key Vault

Key Vault:

```text
kv-cravo-devops
```

Application secrets are stored in Azure Key Vault.

The MongoDB connection string is stored in Key Vault rather than being hard-coded into the application.

Runtime architecture:

```text
Azure Key Vault
      |
      | Managed Identity
      v
Backend VM
      |
      v
Backend Container
```

---

# 14. Frontend Deployment

The frontend is a React/Vite application.

The production build is deployed to:

```text
/var/www/cravo/dist
```

Frontend architecture:

```text
React/Vite Source
       |
       v
npm build
       |
       v
dist/
       |
       v
/var/www/cravo/dist
       |
       v
Nginx
```

Public endpoint:

```text
http://4.225.205.175
```

---

# 15. Nginx

Nginx is installed on:

```text
vm-cravo-frontend
```

Cravo configuration:

```text
/etc/nginx/sites-available/cravo
```

Enabled configuration:

```text
/etc/nginx/sites-enabled/cravo
```

The default Nginx site was disabled to avoid conflicts.

Nginx serves:

1. React/Vite static files.
2. Backend API reverse-proxy requests.

---

# 16. API Reverse Proxy

The frontend and backend communicate through Nginx.

```text
Browser
   |
   v
http://4.225.205.175
   |
   v
Nginx
   |
   +---- React/Vite files
   |
   +---- /api/
             |
             v
       10.0.1.4:5000
             |
             v
       Node/Express
             |
             v
          MongoDB
```

This means the frontend does not directly expose the backend VM.

---

# 17. API Validation

The API proxy can be checked using:

```bash
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/)

echo "API Proxy HTTP Status: $API_STATUS"
```

The deployment validation captures the actual HTTP response instead of relying on an undefined variable.

Application-level API validation includes:

```text
GET /api/restaurants
```

and:

```text
GET /api/restaurants/:id/menu
```

Successful responses confirmed database-backed application functionality.

---

# 18. Backend Health Check

The backend can be tested directly on the backend VM:

```bash
curl -i http://localhost:5000/
```

Expected result:

```text
HTTP/1.1 200 OK
```

This validates:

* Docker
* Node.js
* Express
* Application startup
* Runtime configuration
* MongoDB connectivity
* Backend HTTP response

---

# 19. Frontend Validation

Nginx was validated locally on the frontend VM.

The deployment returned:

```text
HTTP_CODE:200
```

The frontend production build is served from:

```text
/var/www/cravo/dist
```

---

# 20. Frontend Backup and Rollback

Before replacing a frontend deployment, a timestamped backup can be created:

```bash
sudo cp -a /var/www/cravo/dist /var/www/cravo/dist.backup-$(date +%Y%m%d-%H%M%S)
```

Example:

```text
/var/www/cravo/
├── dist/
└── dist.backup-20260818-XXXXXX/
```

This provides a simple rollback mechanism.

---

# 21. Azure VM Run Command

Azure VM Run Command was used for remote deployment and validation operations.

Example:

```powershell
az vm run-command invoke `
  --resource-group rg-cravo-devops `
  --name vm-cravo-frontend `
  --command-id RunShellScript `
  --scripts "<SCRIPT>"
```

This was used for:

* Nginx configuration
* Frontend backup
* Deployment validation
* API validation
* Service checks
* Remote filesystem operations

---

# 22. Azure DevOps

Azure DevOps repository:

```text
Shahzeb-Cravo-DevOps
```

Project:

```text
Cravo-Azure-DevOps
```

Branches:

```text
main
azure/main
azure/HEAD
```

Latest verified commit:

```text
83057cd
```

Commit message:

```text
Complete Azure DevOps deployment and backend containerization
```

---

# 23. Azure DevOps Agent

Self-hosted agent pool:

```text
cravo-agents
```

Agent:

```text
cravo-agent-01
```

Status:

```text
Online/Idle
```

The agent provides the execution environment for Azure DevOps deployment operations.

---

# 24. Azure DevOps Service Connection

Service connection:

```text
cravo-azure-connection
```

Authentication:

```text
Workload Identity Federation / OpenID Connect
```

This avoids storing a long-lived Azure secret or PAT for the service connection.

---

# 25. Security

The deployment implements multiple security controls.

### Network isolation

The backend VM is private.

### Database isolation

MongoDB is not publicly exposed.

### NSG controls

Network Security Groups control traffic between the frontend and backend tiers.

### Managed Identity

Azure resources are accessed using identity-based authentication.

### Key Vault

Production secrets are stored in Azure Key Vault.

### ACR

ACR admin access is disabled.

### Docker

Backend and database services run in isolated containers.

### Reverse proxy

The backend is accessed through the Nginx API layer rather than a public backend endpoint.

---

# 26. Deployment Workflow

The final deployment workflow is:

```text
Developer
    |
    v
Git Repository
    |
    v
Azure DevOps
    |
    +------------------+
    |                  |
    v                  v
Bicep             Docker Build
    |                  |
    v                  v
Azure             Azure Container
Infrastructure       Registry
                         |
                         v
                   Backend VM
                         |
                         v
                   Docker Backend
                         |
                         v
                      MongoDB

Frontend:
React/Vite
    |
    v
Production Build
    |
    v
Frontend VM
    |
    v
Nginx
    |
    +---- Static Frontend
    |
    +---- /api/ ---> Private Backend
```

---

# 27. Deployment Validation Strategy

Validation was performed in layers.

| Layer          | Validation                          |
| -------------- | ----------------------------------- |
| Infrastructure | Azure resources deployed            |
| Networking     | VNet/subnets/NSGs validated         |
| Docker         | Docker Engine/container status      |
| Database       | MongoDB connectivity                |
| Backend        | HTTP 200 health response            |
| Nginx          | Syntax and HTTP validation          |
| Reverse Proxy  | `/api/` routing                     |
| Application    | Restaurant API                      |
| Application    | Menu API                            |
| Frontend       | Production build served             |
| Security       | Managed Identity and Key Vault      |
| Registry       | ACR image deployment                |
| Source Control | Azure DevOps commit synchronization |

---

# 28. Major Problems Resolved

During implementation, several issues were identified and resolved.

### Docker

Docker installation/service issues were resolved and Docker Engine was successfully validated.

### Node.js Compatibility

The backend Docker image was upgraded from Node.js 20 Alpine to Node.js 22 Alpine after dependency compatibility requirements were identified.

### MongoDB

MongoDB connectivity was resolved using a dedicated Docker network and private Azure networking.

### ACR Authentication

Static registry credentials were eliminated through Managed Identity and `AcrPull`.

### Key Vault

Production Key Vault access was configured through Azure Managed Identity.

### Nginx

The missing `proxy_pass` configuration was restored after a PowerShell terminal issue.

### API Routing

An `/api/` routing issue was resolved by correcting Nginx path handling.

### Frontend API Configuration

The production frontend was corrected to use the relative `/api` path instead of development addresses.

### CORS

The frontend origin configuration was corrected in the backend.

### Deployment Validation

The API validation script was corrected to dynamically obtain the HTTP status.

### Frontend Rollback

A timestamped frontend backup mechanism was added.

---

# 29. Final Validation Status

| Component                            | Status |
| ------------------------------------ | ------ |
| Azure Resource Group                 | PASS   |
| Azure VNet                           | PASS   |
| Subnets                              | PASS   |
| NSGs                                 | PASS   |
| Backend VM                           | PASS   |
| Frontend VM                          | PASS   |
| Docker                               | PASS   |
| MongoDB                              | PASS   |
| Backend Container                    | PASS   |
| Backend Health                       | PASS   |
| Azure Container Registry             | PASS   |
| Managed Identity                     | PASS   |
| ACR AcrPull                          | PASS   |
| Azure Key Vault                      | PASS   |
| Nginx                                | PASS   |
| Nginx Configuration                  | PASS   |
| `/api/` Reverse Proxy                | PASS   |
| Frontend Build                       | PASS   |
| Frontend Deployment                  | PASS   |
| Frontend Backup                      | PASS   |
| Restaurant API                       | PASS   |
| Menu API                             | PASS   |
| Azure DevOps Repository              | PASS   |
| Self-hosted Agent                    | PASS   |
| Workload Identity Service Connection | PASS   |
| Git Synchronization                  | PASS   |

---

# 30. Final Project Status

## COMPLETE

The Cravo Azure DevOps and cloud deployment objectives have been completed.

The project has:

* Working Azure infrastructure.
* Working frontend deployment.
* Working private backend deployment.
* Working Docker environment.
* Working MongoDB deployment.
* Working Nginx reverse proxy.
* Working API integration.
* Working Azure Key Vault integration.
* Working ACR integration.
* Managed Identity authentication.
* Azure DevOps source control.
* Deployment validation.
* Frontend rollback preparation.

No core project implementation task remains outstanding.

---

# 31. Optional Future Enhancements

The following are optional improvements and are **not required for the completed project**:

* VM Scale Sets.
* Horizontal autoscaling.
* Azure Load Balancer/Application Gateway.
* Centralized Log Analytics.
* Azure Monitor dashboards.
* More advanced CI/CD automation.
* Blue/green deployment.
* Automated disaster recovery.
* Multi-region deployment.

These can be considered in a future production scalability phase.

---

# 32. Git Repository State

Latest commit:

```text
83057cd
```

Commit message:

```text
Complete Azure DevOps deployment and backend containerization
```

Verified branch state:

```text
HEAD -> main
azure/main
azure/HEAD
```

The latest deployment work is committed and synchronized with Azure DevOps.

---

# 33. Final Conclusion

Cravo has successfully transitioned from a local application into a functional Azure cloud deployment.

The final architecture provides:

* Public frontend access.
* Private backend architecture.
* Dockerized application services.
* Database isolation.
* Secure Azure authentication.
* Centralized secret management.
* Container image management.
* Infrastructure as Code.
* Azure DevOps source control.
* Nginx reverse proxy.
* Application-level validation.
* Deployment rollback capability.

The project therefore meets its defined Azure DevOps and cloud infrastructure objectives.

---

# 34. Final Sign-Off

**Project:** Cravo — Food-Service Application

**Cloud Platform:** Microsoft Azure

**Region:** Sweden Central

**Infrastructure:** Bicep

**Frontend:** React / Vite

**Backend:** Node.js / Express

**Database:** MongoDB

**Containerization:** Docker

**Web Server:** Nginx

**Registry:** Azure Container Registry

**Secrets:** Azure Key Vault

**Authentication:** Managed Identity

**Source Control:** Azure DevOps

**Deployment Status:** COMPLETE

**Validation Status:** COMPLETE

**Overall Status:** COMPLETE

**Latest Commit:** `83057cd`

**Report Date:** 18 August 2026

---

## License

This project is maintained as part of the Cravo application and Azure DevOps/cloud infrastructure implementation.
