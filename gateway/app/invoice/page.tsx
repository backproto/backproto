import type { CSSProperties } from "react";
import { getInvoice, reconcileInvoice } from "@/lib/invoices";
import { getOrInitSettlement } from "@/lib/settlement";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  searchParams: Promise<{
    id?: string | string[];
  }>;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status: string): string {
  if (status === "paid") return "Paid";
  if (status === "expired") return "Expired";
  return "Awaiting payment";
}

export default async function InvoicePage({ searchParams }: InvoicePageProps) {
  const params = await searchParams;
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!rawId) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Invoice not found</h1>
          <p style={copyStyle}>Provide an invoice id in the query string.</p>
        </section>
      </main>
    );
  }

  let invoice = await getInvoice(rawId);
  const settlement = await getOrInitSettlement();
  if (invoice && settlement) {
    invoice = await reconcileInvoice(invoice.id, settlement);
  }

  if (!invoice) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Invoice not found</h1>
          <p style={copyStyle}>This invoice id does not exist or is no longer available.</p>
        </section>
      </main>
    );
  }

  const lightningPayload = invoice.paymentRequest
    ? `lightning:${invoice.paymentRequest}`
    : null;
  const qrUrl = lightningPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(lightningPayload)}`
    : null;

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Pura gateway invoice</p>
        <h1 style={titleStyle}>{formatStatus(invoice.status)}</h1>
        <p style={copyStyle}>
          Invoice <strong>{invoice.id}</strong> is for <strong>{invoice.amount.toLocaleString()} sats</strong>
          {" "}via <strong>{invoice.rail}</strong>.
        </p>

        {qrUrl ? (
          <div style={qrWrapStyle}>
            <img src={qrUrl} alt="Lightning invoice QR code" style={qrStyle} />
          </div>
        ) : null}

        {lightningPayload ? (
          <div style={actionsStyle}>
            <a href={lightningPayload} style={primaryLinkStyle}>Open in Lightning wallet</a>
          </div>
        ) : null}

        <div style={metaStyle}>
          <div style={metaRowStyle}><span style={metaLabelStyle}>Status</span><span>{formatStatus(invoice.status)}</span></div>
          <div style={metaRowStyle}><span style={metaLabelStyle}>Expires</span><span>{formatDate(invoice.expiresAt)}</span></div>
          <div style={metaRowStyle}><span style={metaLabelStyle}>Paid</span><span>{invoice.paidAt ? formatDate(invoice.paidAt) : "Not yet"}</span></div>
          <div style={metaRowStyle}><span style={metaLabelStyle}>Credited</span><span>{invoice.creditedAt ? formatDate(invoice.creditedAt) : "Pending"}</span></div>
        </div>

        {invoice.paymentRequest ? (
          <div style={requestBoxStyle}>
            <div style={metaLabelStyle}>BOLT11</div>
            <code style={codeStyle}>{invoice.paymentRequest}</code>
          </div>
        ) : (
          <p style={copyStyle}>This invoice was created before payment requests were stored. Create a new funding invoice to get a QR-ready page.</p>
        )}

        <p style={footnoteStyle}>Refresh this page after payment if your wallet does not redirect back automatically.</p>
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background: "#0a0a0c",
  color: "#f5f5f5",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "42rem",
  padding: "2rem",
  border: "1px solid #262626",
  background: "#111111",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#8b5cf6",
};

const titleStyle: CSSProperties = {
  margin: "0.75rem 0 1rem",
  fontSize: "2rem",
  lineHeight: 1.1,
};

const copyStyle: CSSProperties = {
  margin: "0 0 1rem",
  lineHeight: 1.6,
  color: "#d4d4d4",
};

const qrWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  margin: "1.5rem 0",
};

const qrStyle: CSSProperties = {
  width: "100%",
  maxWidth: "20rem",
  height: "auto",
  border: "12px solid #ffffff",
  background: "#ffffff",
};

const actionsStyle: CSSProperties = {
  marginBottom: "1.5rem",
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-block",
  padding: "0.8rem 1rem",
  background: "#8b5cf6",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 700,
};

const metaStyle: CSSProperties = {
  margin: "1.5rem 0",
  borderTop: "1px solid #262626",
  borderBottom: "1px solid #262626",
};

const metaRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0.8rem 0",
  borderBottom: "1px solid #1f1f1f",
};

const metaLabelStyle: CSSProperties = {
  color: "#a3a3a3",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontSize: "0.75rem",
};

const requestBoxStyle: CSSProperties = {
  padding: "1rem",
  background: "#0a0a0a",
  border: "1px solid #262626",
};

const codeStyle: CSSProperties = {
  display: "block",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  lineHeight: 1.5,
  color: "#f5f5f5",
};

const footnoteStyle: CSSProperties = {
  marginTop: "1rem",
  fontSize: "0.8rem",
  color: "#a3a3a3",
};