import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

export default function PurchaseButton({ plan, children }) {
  const { siteConfig } = useDocusaurusContext();
  const fields = siteConfig.customFields || {};
  const href = fields.checkoutUrls?.[plan] || fields.commercialContactUrl;

  if (!href) {
    return (
      <span
        className="button button--secondary button--block"
        title="Checkout opens after legal and payment-provider approval"
        aria-disabled="true"
      >
        Sales opening soon
      </span>
    );
  }

  const checkout = Boolean(fields.checkoutUrls?.[plan]);
  return (
    <a
      className="button button--primary button--block"
      href={href}
      rel="noopener noreferrer"
      data-commerce-event={checkout ? "checkout_start" : "commercial_contact"}
      data-commerce-plan={plan}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("canvas-globe:commerce", {
            detail: { event: checkout ? "checkout_start" : "commercial_contact", plan },
          }),
        );
      }}
    >
      {children || (checkout ? "Buy license" : "Contact sales")}
    </a>
  );
}
