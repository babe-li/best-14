# Tanzania Mobile Money & Banking Integration Research

This document outlines the technical architecture and steps for integrating **SMS Tanzania** with local payment providers (**M-Pesa, Tigo Pesa, Airtel Money**) and banks (**CRDB, NMB, NBC**) using the Tanzanian **GePG (Government Electronic Payment Gateway)** or private aggregators (e.g., **Selcom**, **Pesapal**).

## 1. Integration Strategy: Aggregator Model
Directly integrating with every MNO (Mobile Network Operator) and Bank is resource-intensive. The recommended approach for private schools is using a **Payment Aggregator** like **Selcom**, **Beem**, or **AzamPay**.

### Key Providers
- **Selcom (Pay-by-Control-Number / Selcom Pay)**: Supports all MNOs + Bank Push.
- **GePG**: Mandatory for all government institutions and some private entities under government regulation.
- **Pesapal Sabi**: Excellent for integrated point-of-sale and online payments.

---

## 2. Technical Workflow
The goal is **Automatic Reconciliation**.

### Step A: Merchant Onboarding
1. Register as a Merchant with the provider.
2. Obtain **API Keys**, **Secret**, and **Merchant Code**.
3. School is assigned a **Biller Number** (e.g., LUKU-style or Control Number).

### Step B: Payment Trigger (Student Control Number)
Instead of a generic pool, each student's fee invoice generates a unique **Control Number** or a **Reference ID**.
- **Internal ID**: `ST-2026-001`
- **External Ref**: `SMS-TZ-001-2026`

### Step C: The Webhook (IPN - Instant Payment Notification)
When a parent pays via *200*... or Bank App using the Control Number, the aggregator sends a `POST` request to the SMS Server.

#### Sample JSON Payload (Webhook)
```json
{
  "transaction_id": "TZ-MPESA-98231AB",
  "external_reference": "SMS-TZ-001-2026",
  "amount": 450000.00,
  "currency": "TZS",
  "msisdn": "255754XXXXXX",
  "timestamp": "2026-05-02T14:30:00Z",
  "status": "SUCCESS"
}
```

### Step D: Server-Side Reconciliation Logic
1. **Verify Signature**: Ensure the request is authentically from the Aggregator (using Hashing/HMAC).
2. **Lookup Student**: Query the database for the student linked to `external_reference`.
3. **Atomic Update**:
    - Update `feeBalance` in the `students` table.
    - Insert into `payments` table with `method` set (e.g., "M-Pesa").
    - Flag transaction as "Reconciled".
4. **Auto-Receipting**: Trigger the PDF generation engine and send an SMS/Email to the parent.

---

## 3. Bank-Specific Integrations
For banks like **CRDB** and **NMB**:
- **SimBanking Push**: The student enters their ID in the bank app; the bank queries our API to verify the balance before allowing payment (Inquiry API).
- **Control Number Sync**: We push unpaid invoices to the bank's portal nightly.

---

## 4. Regulatory & Security Compliance
- **DPA No. 11 (Tanzania Data Protection Act)**: Ensure PII (names, phone numbers) is encrypted during transit.
- **PCI-DSS**: Ensure credit card data (if used) is handled by the aggregator, not stored locally.
- **Reconciliation Audit Trail**: Maintain a sequence Log of all incoming webhooks to prevent double-crediting if a webhook is retried.
