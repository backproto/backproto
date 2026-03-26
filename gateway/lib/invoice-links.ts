export interface InvoiceLinks {
  invoiceUrl: string;
  statusUrl: string;
  lightningUrl: string;
}

export function buildInvoiceLinks(
  origin: string,
  invoiceId: string,
  paymentRequest: string,
): InvoiceLinks {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  const encodedInvoiceId = encodeURIComponent(invoiceId);

  return {
    invoiceUrl: `${base}/invoice?id=${encodedInvoiceId}`,
    statusUrl: `${base}/api/wallet/status?invoiceId=${encodedInvoiceId}`,
    lightningUrl: `lightning:${paymentRequest}`,
  };
}