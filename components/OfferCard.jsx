"use client"

import { useEffect, useState } from "react"
import chatApi from "../api/chatApi"
import httpClient from "../api/httpClient"
import {
  getPendingClientEmailForJob,
  savePendingClientEmailForJob,
  triggerClientOnboardingAfterPayment,
} from "../utils/clientOnboarding"
import "./OfferCard.scss"

const PAYMENT_TRACKING_KEY = "pendingPaymentJobId"
const CONFIRMED_PAID_JOBS_KEY = "confirmedPaidJobIds"
const PAYMENT_SUCCESS_STATUSES = ["PAID", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "CLIENT_COMPLETED"]
const PAYMENT_PENDING_STATUSES = ["PROVISIONAL", "PENDING_PAYMENT"]
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const formatKES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

const OfferCard = ({ offer, onAccept, onReject, canRespond, isPending, isCreator }) => {
  const [responding, setResponding] = useState(false)
  const [isInitializingPayment, setIsInitializingPayment] = useState(false)
  const [liveJob, setLiveJob] = useState(null)
  const [paymentSyncState, setPaymentSyncState] = useState("")
  const [isLocallyConfirmedPaid, setIsLocallyConfirmedPaid] = useState(false)

  const readLocalPaidConfirmation = (jobId) => {
    if (!jobId || typeof window === "undefined") return false
    try {
      const raw = localStorage.getItem(CONFIRMED_PAID_JOBS_KEY)
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) && arr.map(String).includes(String(jobId))
    } catch {
      return false
    }
  }

  useEffect(() => {
    const jobId = offer?.created_job?.id
    if (!jobId) return

    let isMounted = true
    let intervalId = null

    const fetchJobStatus = async () => {
      try {
        const response = await httpClient.get(`/orders/jobs/${jobId}/`)
        if (!isMounted) return
        setLiveJob(response.data)
      } catch (error) {
        // Keep fallback snapshot from message payload.
      }
    }

    fetchJobStatus()
    intervalId = window.setInterval(fetchJobStatus, 8000)

    return () => {
      isMounted = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [offer?.created_job?.id])

  useEffect(() => {
    const jobId = offer?.created_job?.id
    if (!jobId || typeof window === "undefined") return

    const refresh = () => {
      setIsLocallyConfirmedPaid(readLocalPaidConfirmation(jobId))
    }

    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [offer?.created_job?.id])

  useEffect(() => {
    const jobId = offer?.created_job?.id
    if (!jobId || typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const reference = params.get("reference") || params.get("trxref")
    const status = String(params.get("status") || "").toLowerCase()
    if (!reference && !status) return

    let isMounted = true

    const clearPaymentParams = () => {
      const current = new URL(window.location.href)
      current.searchParams.delete("reference")
      current.searchParams.delete("trxref")
      current.searchParams.delete("status")
      window.history.replaceState({}, "", `${current.pathname}${current.search}`)
    }

    const syncPaymentState = async () => {
      if (status === "failed") {
        if (!isMounted) return
        setPaymentSyncState("failed")
        clearPaymentParams()
        return
      }

      setPaymentSyncState("syncing")

      // Best effort verification for deployments exposing this endpoint.
      if (reference) {
        try {
          await httpClient.post("/orders/payments/paystack/verify/", { reference })
        } catch (error) {
          // Continue with polling job status.
        }
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          const response = await httpClient.get(`/orders/jobs/${jobId}/`)
          const job = response.data
          if (!isMounted) return
          setLiveJob(job)

          if (PAYMENT_SUCCESS_STATUSES.includes(job?.status)) {
            setPaymentSyncState("success")
            setIsLocallyConfirmedPaid(true)
            try {
              const raw = localStorage.getItem(CONFIRMED_PAID_JOBS_KEY)
              const arr = raw ? JSON.parse(raw) : []
              const ids = new Set(Array.isArray(arr) ? arr.map(String) : [])
              ids.add(String(jobId))
              localStorage.setItem(CONFIRMED_PAID_JOBS_KEY, JSON.stringify(Array.from(ids)))
            } catch {}

            await triggerClientOnboardingAfterPayment(jobId)
            clearPaymentParams()
            return
          }

          if (job?.status === "PAYMENT_FAILED") {
            setPaymentSyncState("failed")
            setIsLocallyConfirmedPaid(false)
            clearPaymentParams()
            return
          }
        } catch (error) {
          // keep polling
        }

        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      if (!isMounted) return
      if (status === "success" || status === "successful") {
        // Prevent stale "pending" UI even when backend propagation lags.
        setLiveJob((prev) => ({
          ...(prev || {}),
          id: jobId,
          status: prev?.status || "PAID",
          status_display: prev?.status_display || "Paid",
          payment_required: false,
        }))
        setPaymentSyncState("success")
        setIsLocallyConfirmedPaid(true)
        try {
          const raw = localStorage.getItem(CONFIRMED_PAID_JOBS_KEY)
          const arr = raw ? JSON.parse(raw) : []
          const ids = new Set(Array.isArray(arr) ? arr.map(String) : [])
          ids.add(String(jobId))
          localStorage.setItem(CONFIRMED_PAID_JOBS_KEY, JSON.stringify(Array.from(ids)))
        } catch {}
        await triggerClientOnboardingAfterPayment(jobId)
      } else {
        setPaymentSyncState("")
      }
      clearPaymentParams()
    }

    syncPaymentState()

    return () => {
      isMounted = false
    }
  }, [offer?.created_job?.id])

  const jobStatus = liveJob?.status || offer?.created_job?.status
  const jobStatusDisplay = liveJob?.status_display || offer?.created_job?.status_display || jobStatus
  const initialPaymentRequired =
    typeof liveJob?.payment_required === "boolean"
      ? liveJob.payment_required
      : !!offer?.created_job?.payment_required
  const hasConfirmedPayment = paymentSyncState === "success" || isLocallyConfirmedPaid
  const paymentRequired = !hasConfirmedPayment && initialPaymentRequired && !PAYMENT_SUCCESS_STATUSES.includes(jobStatus)
  const isPaymentFailed = jobStatus === "PAYMENT_FAILED"
  const isPendingPayment = PAYMENT_PENDING_STATUSES.includes(jobStatus)

  const handleAccept = async () => {
    setResponding(true)
    try {
      await onAccept(offer.id)
    } catch (error) {
      console.error("Failed to accept offer:", error)
    } finally {
      setResponding(false)
    }
  }

  const handleReject = async () => {
    setResponding(true)
    try {
      await onReject(offer.id)
    } catch (error) {
      console.error("Failed to reject offer:", error)
    } finally {
      setResponding(false)
    }
  }

  const handlePayNow = async () => {
    const jobId = offer?.created_job?.id
    if (!jobId) {
      alert("Unable to start payment: missing job reference.")
      return
    }

    setIsInitializingPayment(true)
    try {
      const paymentOptions = {}
      if (typeof window !== "undefined") {
        const accessToken = localStorage.getItem("accessToken")
        const guestSessionKey = localStorage.getItem("guestSessionKey")
        const isGuestFlow = !accessToken && !!guestSessionKey

        if (isGuestFlow) {
          const suggestedEmail = getPendingClientEmailForJob(jobId)
          const inputEmail = window.prompt(
            "Enter your email to continue payment and account setup:",
            suggestedEmail
          )
          if (inputEmail === null) {
            setIsInitializingPayment(false)
            return
          }

          const clientEmail = inputEmail.trim().toLowerCase()
          if (!EMAIL_REGEX.test(clientEmail)) {
            alert("Please enter a valid email address.")
            setIsInitializingPayment(false)
            return
          }

          const password = window.prompt(
            "Create a password for your new client account (minimum 8 characters):",
            ""
          )
          if (password === null) {
            setIsInitializingPayment(false)
            return
          }

          const passwordConfirm = window.prompt("Confirm your password:", "")
          if (passwordConfirm === null) {
            setIsInitializingPayment(false)
            return
          }

          if (password.length < MIN_PASSWORD_LENGTH) {
            alert("Password must be at least 8 characters.")
            setIsInitializingPayment(false)
            return
          }

          savePendingClientEmailForJob(jobId, clientEmail)
          paymentOptions.sessionKey = guestSessionKey
          paymentOptions.clientEmail = clientEmail
          paymentOptions.clientPassword = password
          paymentOptions.clientPasswordConfirm = passwordConfirm
        }
      }

      setIsLocallyConfirmedPaid(false)
      try {
        const raw = localStorage.getItem(CONFIRMED_PAID_JOBS_KEY)
        const arr = raw ? JSON.parse(raw) : []
        const ids = new Set(Array.isArray(arr) ? arr.map(String) : [])
        ids.delete(String(jobId))
        localStorage.setItem(CONFIRMED_PAID_JOBS_KEY, JSON.stringify(Array.from(ids)))
      } catch {}

      const paymentData = await chatApi.initializeJobPayment(jobId, paymentOptions)
      if (paymentData.authorizationUrl) {
        localStorage.setItem(PAYMENT_TRACKING_KEY, String(jobId))
        window.location.href = paymentData.authorizationUrl
        return
      }
      alert("Unable to start payment: checkout URL is missing.")
    } catch (error) {
      console.error("Payment initialization failed:", error)
      const data = error.response?.data || {}
      alert(
        data.client_password_confirm ||
          data.client_password ||
          data.client_email ||
          data.detail ||
          "Failed to initialize payment. Please try again."
      )
    } finally {
      setIsInitializingPayment(false)
    }
  }

  const getStatusBadge = () => {
    if (offer.status === "accepted") {
      return (
        <span className="status-badge status-accepted">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Accepted
        </span>
      )
    }
    if (offer.status === "rejected") {
      return (
        <span className="status-badge status-rejected">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          Rejected
        </span>
      )
    }
    return (
      <span className="status-badge status-pending">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Pending Response
      </span>
    )
  }

  return (
    <div className="offer-card">
      <div className="offer-card-header">
        <div className="offer-title-section">
          <div className="offer-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 className="offer-label">Project Offer</h3>
        </div>
        {getStatusBadge()}
      </div>

      <div className="offer-card-body">
        <div className="offer-detail">
          <label>Title</label>
          <p className="offer-title">{offer.title}</p>
        </div>

        <div className="offer-metrics">
          <div className="metric-item metric-price">
            <label>Price</label>
            <p className="metric-value">
              {formatKES(offer.price)}
            </p>
          </div>
          <div className="metric-item metric-timeline">
            <label>Delivery Time</label>
            <p className="metric-value">
              {offer.timeline} {offer.timeline === 1 ? "day" : "days"}
            </p>
          </div>
        </div>

        {offer.description && (
          <div className="offer-detail">
            <label>Description</label>
            <p className="offer-description">{offer.description}</p>
          </div>
        )}

        {offer.attachments && offer.attachments.length > 0 && (
          <div className="offer-attachments">
            <label>Attachments ({offer.attachments.length})</label>
            <div className="attachments-list">
              {offer.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  download={attachment.name}
                  className="attachment-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="attachment-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                      <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                  </div>
                  <div className="attachment-info">
                    <span className="attachment-name">{attachment.name}</span>
                    {attachment.size_kb && (
                      <span className="attachment-size">
                        {attachment.size_kb < 1024
                          ? `${attachment.size_kb.toFixed(1)} KB`
                          : `${attachment.size_mb.toFixed(2)} MB`
                        }
                      </span>
                    )}
                  </div>
                  <div className="attachment-download">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {offer.status === 'accepted' && offer.created_job && (
        <div className="offer-job-created">
          <div className="job-created-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
              <h4>{paymentRequired ? "Job Created Successfully!" : "Payment Confirmed"}</h4>
              <p className="job-status">Status: <strong>{jobStatusDisplay}</strong></p>
            </div>
          </div>

          {paymentRequired && (
            <div className="payment-required-section">
              <div className="payment-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>
                  {paymentSyncState === "syncing"
                    ? "Confirming your payment..."
                    : isPaymentFailed
                    ? "Payment failed. Retry now to activate this job."
                    : isPendingPayment
                    ? "Payment required to start work"
                    : "Payment processing. You can retry if needed."}
                </span>
              </div>
              <button
                onClick={handlePayNow}
                disabled={isInitializingPayment}
                className="btn-pay-now"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                {isInitializingPayment
                  ? "Redirecting..."
                  : isPaymentFailed
                  ? "Pay Again"
                  : "Pay Now"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Logic to hide Accept/Reject for the offer creator (client) */}
      {canRespond && isPending && !isCreator && (
        <div className="offer-card-actions">
          <p className="offer-response-helper">
            Review the offer details above, then choose <strong>Accept Offer</strong> to proceed or <strong>Reject</strong> to decline.
          </p>
          <button
            onClick={handleAccept}
            disabled={responding}
            className="btn-action btn-accept"
          >
            {responding ? (
              <>
                <div className="spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Accept Offer
              </>
            )}
          </button>
          <button
            onClick={handleReject}
            disabled={responding}
            className="btn-action btn-reject"
          >
            {responding ? (
              <>
                <div className="spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Reject
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default OfferCard
