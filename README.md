# The Project

This is a simulation of how a microservices e-commerce application is deployed and operated on AWS. Six independently deployed services run on Amazon Elastic Kubernetes Service (EKS), with each service owning its own RDS PostgreSQL database for strict data isolation. The wider infrastructure leans on AWS native tooling throughout ECR for container image storage, S3 for static frontend hosting and product assets, Secrets Manager for credential management, and IAM with IRSA for fine grained, pod level access control, no long lived credentials anywhere in the system.

# ecom-service

Source code for all six backend microservices and the CI pipeline that builds and ships them. Each service is a self-contained Node.js/Fastify application with its own Dockerfile, database migrations, and package configuration. When a change is pushed to `main` under a service's directory, the corresponding GitHub Actions workflow triggers: authenticates to AWS via OIDC, builds and pushes the container image to ECR, then updates the GitOps repository — which ArgoCD picks up to trigger a rollout.

---

## High-Level Architecture (only the main componants is showing)

```
                         ┌────────────────────────────────────────────────────────────────┐
                         │                        AWS Cloud                               │
      S3                 │                                                                │
  ┌──────────┐           │  ┌──────────────────────────────────────────────────────────┐  │
  │ React app│──HTTPS───►│  │              EKS Cluster  (private subnets)              │  │
  └──────────┘           │  │                                                          │  │
        ▲                │  │   ┌─────────────────────────────────────────────────┐    │  │
        │  HTTPS         │  │   │           ALB Ingress Controller                │    │  │
  ┌──────────┐           │  │   └──────┬──────┬──────┬──────┬──────┬───────────── ┘    │  │
  │  browser │           │  │          │      │      │      │      │                   │  │
  │          │           │  │         ▼      ▼      ▼      ▼      ▼                    │  │
  │          │           │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │  │
  └──────────┘           │  │  │   auth   │ │ catalog  │ │   cart   │                  │  │
                         │  │  │ :3001    │ │  :3002   │ │  :3003   │                  │  │
                         │  │  └────┬─────┘ └────┬─────┘ └────┬─────┘                  │  │
                         │  │       │             │             │                      │  │
                         │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │  │
                         │  │  │  order   │ │ payment  │ │  notif.  │                  │  │
                         │  │  │  :3004   │ │  :3005   │ │  :3006   │                  │  │
                         │  │  └────┬─────┘ └────┬─────┘ └──────────┘                  │  │
                         │  │       │             │                                    │  │
                         │  └───────┼─────────────┼────────────────────────────────────┘  │
                         │          │             │                                       │
                         │  ┌───────▼─────────────▼─────────────────────────────────┐     │
                         │  │                  RDS PostgreSQL (one per service)      │    │
                         │  │   authdb │ productdb │ cartdb │ orderdb │ paymentdb    │    │
                         │  └───────────────────────────────────────────────────────┘     │
                         │                                                                │
                         │  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐      │
                         │  │  ECR  (x6)   │  │ Secrets Manager│  │  IAM + IRSA    │      │
                         │  │ image repos  │  │  (DB creds)    │  │ (pod-level)    │      │
                         │  └──────────────┘  └────────────────┘  └────────────────┘      │
                         └────────────────────────────────────────────────────────────────┘
```

---

## CI/CD Pipeline — Sequence Diagram

```
  Developer        GitHub           GitHub Actions          AWS ECR       ecom-gitops      ArgoCD / EKS
      │               │                   │                    │               │                 │
      │──git push────►│                   │                    │               │                 │
      │  main /       │                   │                    │               │                 │
      │  auth-service │                   │                    │               │                 │
      │               │──── trigger ─────►│                    │               │                 │
      │               │  (auth_ci.yml)    │                    │               │                 │
      │               │                   │                    │               │                 │
      │               │                   │──OIDC assume role─►│               │                 │
      │               │                   │  (no stored creds) │               │                 │
      │               │                   │                    │               │                 │
      │               │                   │──docker build──────│               │                 │
      │               │                   │──docker push──────►│               │                 │
      │               │                   │  tag: commit SHA   │               │                 │
      │               │                   │                    │               │                 │
      │               │                   │──checkout ────────────────────────►│                 │
      │               │                   │   ecom-gitops      │               │                 │
      │               │                   │                    │               │                 │
      │               │                   │──yq update ───────────────────────►│                 │
      │               │                   │  deployment.yml    │               │                 │
      │               │                   │  image: <sha>      │               │                 │
      │               │                   │                    │               │                 │
      │               │                   │──git commit+push──────────────────►│                 │
      │               │                   │                    │               │                 │
      │               │                   │                    │               │──poll main──────►│
      │               │                   │                    │               │   detects diff   │
      │               │                   │                    │               │                 │
      │               │                   │                    │               │◄──apply manifest─│
      │               │                   │                    │               │                 │
      │               │                   │                    │               │      rolling update ✓
```

---

## Service Responsibilities

```
┌─────────────────────┬────────────────────────────────────────────────────────────┐
│  Service            │  Responsibility & Data Store                               │
├─────────────────────┼────────────────────────────────────────────────────────────┤
│  auth-service       │  JWT sign-up / login, token validation                     │
│                     │  DB: authdb (RDS)  |  Reads creds: Secrets Manager (IRSA)  │
├─────────────────────┼────────────────────────────────────────────────────────────┤
│  catalog-service    │  Product listings, search, image URLs served from S3       │
│                     │  DB: productdb (RDS)                                       │
├─────────────────────┼────────────────────────────────────────────────────────────┤
│  cart-service       │  Per-user cart state, add / remove / clear items           │
│                     │  DB: cartdb (RDS)                                          │
├─────────────────────┼────────────────────────────────────────────────────────────┤
│  order-service      │  Order creation, status updates, order history             │
│                     │  DB: orderdb (RDS)  | Emits: order.placed event            │
├─────────────────────┼────────────────────────────────────────────────────────────┤
│  payment-service    │  Payment processing, confirms or rejects orders            │
│                     │  DB: paymentdb (RDS) | Emits: payment.done event           │
├─────────────────────┼────────────────────────────────────────────────────────────┤
│  notification-svc   │  Consumes events → sends order/payment alerts to users     │
│                     │  Stateless — event-driven only, no DB                      │
└─────────────────────┴────────────────────────────────────────────────────────────┘
```

---

## Service Interaction Flow

```
  User
   │
   ├──[1] POST /register or /login ──────────────────────► auth-service
   │                                                           │
   │                                                    returns JWT token
   │
   ├──[2] GET /products ─────────────────────────────────► catalog-service
   │                                                           │
   │                                                    returns product list + S3 image URLs
   │
   ├──[3] POST /cart/add ────────────────────────────────► cart-service
   │
   ├──[4] POST /orders ──────────────────────────────────► order-service
   │                                                           │
   │                                                    ┌──────┴──────┐
   │                                                    │             │
   │                                              POST /pay      Emit event
   │                                                    ▼             ▼
   │                                          payment-service   notification-service
   │                                                    │             │
   │                                            confirm/reject   send email/alert
   │
   └──[5] GET /orders ───────────────────────────────────► order-service
                                                               (order history)
```

---

## Data Isolation Model

```
          ┌─────────────────────────────────────────────────────────────┐
          │                  RDS PostgreSQL Instances                   │
          │                                                             │
          │  auth-service     ───────────►  authdb                     │
          │  catalog-service  ───────────►  productdb                  │
          │  cart-service     ───────────►  cartdb                     │
          │  order-service    ───────────►  orderdb                    │
          │  payment-service  ───────────►  paymentdb                  │
          │  notification-svc ───────────►  (none — event consumer)    │
          │                                                             │
          │  Rule: no service queries another service's DB directly.   │
          │  All cross-service data flows through API calls.            │
          └─────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
ecom-backend/
│
├── auth-service/
│   ├── index.js             # Fastify app — JWT auth, user registration/login
│   ├── dockerfile
│   ├── knexfile.js          # DB connection config (reads from AWS Secrets Manager via IRSA)
│   ├── migrate.js           # Migration runner
│   └── migrations/          # SQL schema migrations
│
├── catalog-service/         # Product listing, search, image URLs from S3
├── cart-service/            # Cart state management per user session
├── order-service/           # Order creation and status tracking
├── payment-service/         # Payment processing integration
├── notification-service/    # Event-driven notifications (order/payment events)
│
└── .github/
    └── workflows/
        ├── auth_ci.yml      # CI: build image → push to ECR → update GitOps manifest
        ├── catalog_ci.yml
        ├── cart_ci.yml
        ├── order_ci.yml
        ├── payment_ci.yml
        └── notification_ci.yml
```

---

**CI pipeline per service:**

1. Triggered on `push` to `main` scoped to the service directory
2. Authenticates to AWS using GitHub OIDC — no stored AWS credentials
3. Builds Docker image and pushes to ECR tagged with the commit SHA
4. Checks out `ecom-gitops` repo and updates `deployment.yml` + `migration_job.yml` with the new image tag using `yq`
5. Commits and pushes the manifest change — ArgoCD takes it from there
