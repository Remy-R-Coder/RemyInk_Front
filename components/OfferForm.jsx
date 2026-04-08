"use client"

import { useState } from "react"
import "./OfferForm.scss"

const MAX_ATTACHMENTS = 3
const MAX_FILE_SIZE_MB = 10

/**
 * Updated Formatter: Uses US locale and USD currency
 */
const formatUSD = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

const OfferForm = ({ onSend, onCancel, isSending }) => {
  const [offer, setOffer] = useState({
    title: "",
    price: "",
    timeline: "",
    description: "",
  })
  const [attachments, setAttachments] = useState([])
  const [errors, setErrors] = useState({})
  const isSubmitDisabled = isSending || Object.keys(errors).some(key => errors[key] && key !== 'attachments')
  const priceValue = parseFloat(offer.price)
  const timelineValue = parseInt(offer.timeline)

  const validate = () => {
    const newErrors = {}

    if (!offer.title.trim()) {
      newErrors.title = "Project title is required."
    }

    const price = parseFloat(offer.price)
    if (!offer.price || isNaN(price) || price <= 0) {
      newErrors.price = "Price must be a valid amount greater than $0."
    }

    const timeline = parseInt(offer.timeline)
    if (!offer.timeline || isNaN(timeline) || timeline < 1) {
      newErrors.timeline = "Delivery timeline must be at least 1 day."
    }

    if (attachments.length > MAX_ATTACHMENTS) {
      newErrors.attachments = `You can upload a maximum of ${MAX_ATTACHMENTS} files.`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = [...attachments]
    const currentErrors = {}

    for (const file of files) {
      if (newAttachments.length >= MAX_ATTACHMENTS) {
        currentErrors.attachments = `Maximum ${MAX_ATTACHMENTS} attachments reached.`
        break
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        currentErrors.attachments = `File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
        continue
      }
      
      newAttachments.push(file)
    }

    setAttachments(newAttachments)
    setErrors({ ...errors, ...currentErrors, attachments: currentErrors.attachments || null })
    e.target.value = null 
  }

  const handleRemoveAttachment = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    setAttachments(newAttachments)
    setErrors({ ...errors, attachments: newAttachments.length < MAX_ATTACHMENTS ? null : errors.attachments })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    onSend({
      title: offer.title.trim(),
      price: parseFloat(offer.price),
      timeline: parseInt(offer.timeline),
      description: offer.description.trim(),
      attachments: attachments,
    })
  }

  const handleChange = (field, value) => {
    setOffer({ ...offer, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: null })
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="offer-form-container">
      <div className="offer-form-header">
        <div className="header-title">
          <div className="title-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div>
            <h3>Send Project Offer</h3>
            <p className="header-subtitle">Share a clear proposal the client can accept instantly.</p>
          </div>
        </div>
        <button onClick={onCancel} className="btn-close" type="button" disabled={isSending}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="offer-form">
        <div className="offer-preview-bar">
          <div className="preview-item">
            <span className="preview-label">Offer value</span>
            <strong className="preview-value">
              {Number.isFinite(priceValue) && priceValue > 0 ? formatUSD(priceValue) : "Set price"}
            </strong>
          </div>
          <div className="preview-divider" />
          <div className="preview-item">
            <span className="preview-label">Delivery</span>
            <strong className="preview-value">
              {Number.isFinite(timelineValue) && timelineValue > 0 ? `${timelineValue} day${timelineValue > 1 ? "s" : ""}` : "Set timeline"}
            </strong>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="offer-title">
            Project Title <span className="required">*</span>
          </label>
          <input
            id="offer-title"
            type="text"
            value={offer.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className={`form-input ${errors.title ? "error" : ""}`}
            placeholder="e.g., Build a responsive marketing landing page"
            disabled={isSending}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="offer-price">
              Price (USD) <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon">$</span>
              <input
                id="offer-price"
                type="number"
                step="0.01"
                min="0"
                value={offer.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className={`form-input with-icon ${errors.price ? "error" : ""}`}
                placeholder="50.00"
                disabled={isSending}
              />
            </div>
            {errors.price && <span className="error-message">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="offer-timeline">
              Delivery Time <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                id="offer-timeline"
                type="number"
                min="1"
                value={offer.timeline}
                onChange={(e) => handleChange("timeline", e.target.value)}
                className={`form-input ${errors.timeline ? "error" : ""}`}
                placeholder="7"
                disabled={isSending}
              />
              <span className="input-suffix">days</span>
            </div>
            {errors.timeline && <span className="error-message">{errors.timeline}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="offer-description">
            Project Description <span className="optional">(Optional)</span>
          </label>
          <textarea
            id="offer-description"
            value={offer.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="form-textarea"
            placeholder="Provide a detailed scope of work, expected deliverables, and how you will execute the project."
            rows={4}
            disabled={isSending}
          />
        </div>
        
        <div className="form-group form-group--attachments">
          <label htmlFor="offer-attachments">
            Attachments 
            <span className="optional"> (Max {MAX_ATTACHMENTS} files, {MAX_FILE_SIZE_MB}MB each)</span>
          </label>
          <input
            id="offer-attachments"
            type="file"
            multiple
            onChange={handleFileChange}
            className="form-file-input"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={isSending || attachments.length >= MAX_ATTACHMENTS}
          />
          <label htmlFor="offer-attachments" className={`file-upload-cta ${attachments.length >= MAX_ATTACHMENTS || isSending ? "disabled" : ""}`}>
            <span className="file-upload-cta__title">Attach project files</span>
            <span className="file-upload-cta__meta">PDF, DOC, DOCX, JPG, PNG up to {MAX_FILE_SIZE_MB}MB each</span>
          </label>

          <div className="attachments-preview">
            {attachments.map((file, index) => (
              <div key={file.name + index} className="attachment-item-preview">
                <span className="attachment-name-preview">
                  {file.name} 
                  <span className="attachment-size-preview">({formatFileSize(file.size)})</span>
                </span>
                <button 
                  type="button" 
                  onClick={() => handleRemoveAttachment(index)} 
                  className="btn-remove-attachment"
                  disabled={isSending}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {errors.attachments && <span className="error-message">{errors.attachments}</span>}
        </div>


        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="btn-submit"
          >
            {isSending ? (
              <>
                <div className="spinner"></div>
                Sending Offer...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Send Offer to Client
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="btn-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default OfferForm