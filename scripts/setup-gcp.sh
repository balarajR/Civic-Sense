#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CivicSense — GCP Bootstrap Script
# Run this ONCE to set up the GCP infrastructure for GitHub Actions deployment.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated  (gcloud auth login)
#   - Billing enabled on your GCP project
#   - gh CLI installed (for adding GitHub secrets)
#
# Usage:
#   chmod +x scripts/setup-gcp.sh
#   ./scripts/setup-gcp.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── 1. CONFIGURE THESE VALUES ─────────────────────────────────────────────
PROJECT_ID="civic-sence"           # Your GCP project ID
REGION="us-central1"               # Cloud Run deployment region
SERVICE_NAME="civicsense"          # Cloud Run service name
AR_REPO="civicsense-repo"          # Artifact Registry repo name
SA_NAME="civicsense-deployer"      # Service account name
GITHUB_ORG="balaraj74"            # Your GitHub username / org
GITHUB_REPO="CivicSense"          # Your GitHub repo name
# ──────────────────────────────────────────────────────────────────────────

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_NAME="github-pool"
POOL_ID="projects/${PROJECT_ID}/locations/global/workloadIdentityPools/${POOL_NAME}"
PROVIDER_NAME="github-provider"

echo "🚀 Setting up GCP for CivicSense deployment"
echo "   Project : $PROJECT_ID"
echo "   Region  : $REGION"
echo ""

# Set active project
gcloud config set project "$PROJECT_ID"

# ── 2. Enable required APIs ───────────────────────────────────────────────
echo "📦 Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

echo "✅ APIs enabled"

# ── 3. Create Artifact Registry repository ───────────────────────────────
echo "📦 Creating Artifact Registry repository..."
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="CivicSense container images" \
  --quiet 2>/dev/null || echo "   (repository already exists, skipping)"

echo "✅ Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"

# ── 4. Create deployer service account ────────────────────────────────────
echo "🔑 Creating service account..."
gcloud iam service-accounts create "$SA_NAME" \
  --display-name="CivicSense GitHub Actions Deployer" \
  --quiet 2>/dev/null || echo "   (service account already exists, skipping)"

# Grant required roles
echo "🔑 Granting IAM roles..."
for ROLE in \
  "roles/run.admin" \
  "roles/artifactregistry.writer" \
  "roles/iam.serviceAccountUser" \
  "roles/secretmanager.secretAccessor"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --quiet
done

echo "✅ Service account: $SA_EMAIL"

# ── 5. Create Secrets in Secret Manager ──────────────────────────────────
echo "🔐 Creating Secret Manager secrets (if not exist)..."
for SECRET in GEMINI_API_KEY DATA_GOV_IN_API_KEY; do
  gcloud secrets create "$SECRET" --quiet 2>/dev/null || \
    echo "   (secret $SECRET already exists)"
done

echo ""
echo "⚠️  ACTION REQUIRED: Add secret values manually:"
echo "   gcloud secrets versions add GEMINI_API_KEY --data-file=-"
echo "   gcloud secrets versions add DATA_GOV_IN_API_KEY --data-file=-"
echo ""

# ── 6. Set up Workload Identity Federation (keyless auth) ─────────────────
echo "🔗 Setting up Workload Identity Federation..."

# Create pool
gcloud iam workload-identity-pools create "$POOL_NAME" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --quiet 2>/dev/null || echo "   (pool already exists, skipping)"

# Create provider
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
  --location="global" \
  --workload-identity-pool="$POOL_NAME" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --quiet 2>/dev/null || echo "   (provider already exists, skipping)"

# Allow GitHub repo to impersonate service account
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}" \
  --quiet

# Get the full provider resource name
PROVIDER_RESOURCE=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
  --location="global" \
  --workload-identity-pool="$POOL_NAME" \
  --format="value(name)")

echo "✅ Workload Identity Federation configured"
echo ""

# ── 7. Output GitHub Secrets to add ───────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════════════"
echo "  ADD THESE SECRETS TO GITHUB:"
echo "  Settings → Secrets and variables → Actions → New repository secret"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "  GCP_PROJECT_ID                  = $PROJECT_ID"
echo "  GCP_REGION                      = $REGION"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER  = $PROVIDER_RESOURCE"
echo "  GCP_SERVICE_ACCOUNT             = $SA_EMAIL"
echo ""
echo "  # Frontend build-time vars (from your .env):"
echo "  VITE_FIREBASE_API_KEY           = <your value>"
echo "  VITE_FIREBASE_AUTH_DOMAIN       = <your value>"
echo "  VITE_FIREBASE_PROJECT_ID        = <your value>"
echo "  VITE_FIREBASE_STORAGE_BUCKET    = <your value>"
echo "  VITE_FIREBASE_MESSAGING_SENDER_ID = <your value>"
echo "  VITE_FIREBASE_APP_ID            = <your value>"
echo "  VITE_FIREBASE_MEASUREMENT_ID    = <your value>"
echo "  VITE_GOOGLE_MAPS_API_KEY        = <your value>"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "🎉 GCP setup complete! Push to main to trigger your first deployment."
