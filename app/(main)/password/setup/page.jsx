"use client"

import PasswordSetup from "@/components/password-setup/PasswordSetup"

/**
 * Password setup confirmation page.
 * Expects uid/token in query params from secure email link.
 * @returns {JSX.Element}
 */
export default function PasswordSetupPage() {
  return <PasswordSetup />
}
