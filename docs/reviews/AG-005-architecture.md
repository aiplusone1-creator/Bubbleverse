# AG-005 architecture decision

Baseline `1887fe00508d0a24566fe0261bd882998b817ca2`. The public wizard currently invokes the Gemini Edge Function directly, then saves text using the owner-scoped atomic save RPC. Existing saved stories retain their current schema and access rules.

Reuse `public.user_roles`. Preserve `admin`, `moderator` and `user`, add `operator`, and treat an authenticated account with an active profile as eligible for customer operations. Role checks depend on database records. The order data API uses explicit RPC projections so ownership alone never exposes internal notes or payment references. Staff see redacted queue rows before claiming. An atomic conditional update controls claims and audit writes share the same transaction.

Separate intake, payment, generation and fulfillment state. Currency follows country. Pricing is an immutable minor-unit snapshot calculated from operator-managed configuration. With payment configuration absent only inquiry intake is available. Manual confirmation requires privileged authorization and matching currency and amount. A receipt is evidence only.

Use an isolated private photo bucket with server-owned object identities. The trusted processing path must validate content, dimensions and consent before registering an asset. Keep uploads disabled until that path exists. Never pass asset IDs or photos to the text provider. Keep B2B contact records outside child order data.

Generation must claim a paid, reviewed order transactionally and derive text inputs from its stored configuration. The trusted worker owns result persistence. Reuse the existing request quotas and preserve the default kill switch. A failed or ambiguous provider attempt requires explicit recovery. Generated text must never imply delivery, printing or PDF availability.

The primary threats are cross-owner access, role escalation, forged payment or file metadata, staff access before claim, concurrent retries, caller-controlled provider inputs and unintended disclosure through outbound links. Explicit grants, transaction-local checks, allowlisted payloads, idempotent transitions and redacted responses are the boundaries for these cases.
