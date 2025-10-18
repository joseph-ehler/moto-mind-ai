/**
 * Email Templates for Ownership Notifications
 * Phase 2: Friendly, non-adversarial messaging
 */

export interface VehicleDetails {
  displayName: string
  vin: string
  lastMileage?: number
  lastActivity: Date
}

// ============================================================================
// AUTO-TRANSFER NOTIFICATION (FYI Only)
// ============================================================================

export function getAutoTransferEmail(params: {
  recipientName?: string
  vehicle: VehicleDetails
  reason: 'inactive_90_days' | 'mileage_proof'
  daysSinceActivity?: number
  reclaimUrl: string
}) {
  const { recipientName, vehicle, reason, daysSinceActivity, reclaimUrl } = params
  
  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi'
  
  const reasonText = reason === 'mileage_proof'
    ? `someone has been actively driving it (they've logged higher mileage than your last update).`
    : `you haven't used MotoMind for this vehicle in ${daysSinceActivity} days.`
  
  return {
    subject: `Your ${vehicle.displayName} was auto-transferred`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Vehicle Ownership Update</h2>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          ${greeting},
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          We've transferred your <strong>${vehicle.displayName}</strong> (VIN: ${vehicle.vin}) 
          to another MotoMind user because ${reasonText}
        </p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e; font-weight: 600;">
            💡 If you still own this vehicle
          </p>
          <p style="margin: 8px 0 0 0; color: #92400e;">
            You have <strong>30 days</strong> to reclaim it. After that, the transfer becomes permanent.
          </p>
        </div>
        
        <a href="${reclaimUrl}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">
          Reclaim This Vehicle
        </a>
        
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 24px;">
          If you sold, traded, or no longer own this vehicle, no action is needed.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="font-size: 12px; color: #9ca3af;">
          MotoMind • Your AI Vehicle Assistant
        </p>
      </div>
    `,
    text: `
${greeting},

We've transferred your ${vehicle.displayName} (VIN: ${vehicle.vin}) to another MotoMind user because ${reasonText}

If you still own this vehicle:
You have 30 days to reclaim it: ${reclaimUrl}

If you sold, traded, or no longer own this vehicle, no action is needed.

- MotoMind Team
    `
  }
}

// ============================================================================
// OWNERSHIP CHECK-IN (Simple Question)
// ============================================================================

export function getOwnershipCheckInEmail(params: {
  recipientName?: string
  vehicle: VehicleDetails
  daysSinceActivity: number
  confirmSoldUrl: string
  confirmStillOwnUrl: string
}) {
  const { recipientName, vehicle, daysSinceActivity, confirmSoldUrl, confirmStillOwnUrl } = params
  
  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi'
  
  return {
    subject: `Quick question about your ${vehicle.displayName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Quick Vehicle Check-In</h2>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          ${greeting},
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Someone added your <strong>${vehicle.displayName}</strong> to their MotoMind garage.
        </p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
            Did you sell this vehicle?
          </p>
        </div>
        
        <div style="display: flex; gap: 12px; margin: 24px 0;">
          <a href="${confirmSoldUrl}" 
             style="flex: 1; background: #10b981; color: white; padding: 14px; text-align: center;
                    text-decoration: none; border-radius: 6px; font-weight: 600;">
            Yes, I sold it
          </a>
          
          <a href="${confirmStillOwnUrl}" 
             style="flex: 1; background: #6b7280; color: white; padding: 14px; text-align: center;
                    text-decoration: none; border-radius: 6px; font-weight: 600;">
            No, I still own it
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          Note: It's been <strong>${daysSinceActivity} days</strong> since you last used this vehicle in MotoMind.
        </p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            If we don't hear from you in <strong>7 days</strong>, we'll assume the vehicle was sold 
            and complete the transfer automatically.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="font-size: 12px; color: #9ca3af;">
          MotoMind • Your AI Vehicle Assistant
        </p>
      </div>
    `,
    text: `
${greeting},

Someone added your ${vehicle.displayName} to their MotoMind garage.

Did you sell this vehicle?

→ Yes, I sold it: ${confirmSoldUrl}
→ No, I still own it: ${confirmStillOwnUrl}

Note: It's been ${daysSinceActivity} days since you last used this vehicle in MotoMind.

If we don't hear from you in 7 days, we'll assume the vehicle was sold and complete the transfer automatically.

- MotoMind Team
    `
  }
}

// ============================================================================
// VERIFICATION NEEDED (Active Owner)
// ============================================================================

export function getVerificationNeededEmail(params: {
  recipientName?: string
  vehicle: VehicleDetails
  daysSinceActivity: number
  confirmStillOwnUrl: string
  confirmSoldUrl: string
}) {
  const { recipientName, vehicle, daysSinceActivity, confirmStillOwnUrl, confirmSoldUrl } = params
  
  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi'
  
  return {
    subject: `Action needed: Verify ownership of your ${vehicle.displayName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Ownership Verification Required</h2>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          ${greeting},
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Another user is trying to add your <strong>${vehicle.displayName}</strong> (VIN: ${vehicle.vin}) 
          to their MotoMind garage.
        </p>
        
        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #991b1b; font-weight: 600;">
            ⚠️ Action Required
          </p>
          <p style="margin: 8px 0 0 0; color: #991b1b;">
            Please confirm you still own this vehicle.
          </p>
        </div>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Do you still own this vehicle?
        </p>
        
        <div style="display: flex; gap: 12px; margin: 24px 0;">
          <a href="${confirmStillOwnUrl}" 
             style="flex: 1; background: #2563eb; color: white; padding: 14px; text-align: center;
                    text-decoration: none; border-radius: 6px; font-weight: 600;">
            Yes, I still own it
          </a>
          
          <a href="${confirmSoldUrl}" 
             style="flex: 1; background: #6b7280; color: white; padding: 14px; text-align: center;
                    text-decoration: none; border-radius: 6px; font-weight: 600;">
            No, I sold it
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          You were last active with this vehicle <strong>${daysSinceActivity} days ago</strong>.
        </p>
        
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          Please respond within <strong>48 hours</strong>. If we don't hear from you, we'll need to 
          investigate further to resolve this conflict.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="font-size: 12px; color: #9ca3af;">
          MotoMind • Your AI Vehicle Assistant
        </p>
      </div>
    `,
    text: `
${greeting},

Another user is trying to add your ${vehicle.displayName} (VIN: ${vehicle.vin}) to their MotoMind garage.

ACTION REQUIRED: Please confirm you still own this vehicle.

→ Yes, I still own it: ${confirmStillOwnUrl}
→ No, I sold it: ${confirmSoldUrl}

You were last active with this vehicle ${daysSinceActivity} days ago.

Please respond within 48 hours.

- MotoMind Team
    `
  }
}

// ============================================================================
// WELCOME NEW OWNER
// ============================================================================

export function getNewOwnerWelcomeEmail(params: {
  recipientName?: string
  vehicle: VehicleDetails
  resolutionType: 'instant' | 'pending' | 'verified'
  previousOwnerDaysSinceActivity?: number
}) {
  const { recipientName, vehicle, resolutionType, previousOwnerDaysSinceActivity } = params
  
  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi'
  
  let statusMessage = ''
  if (resolutionType === 'instant') {
    statusMessage = `The previous owner hadn't used this vehicle in ${previousOwnerDaysSinceActivity}+ days, so we automatically transferred ownership to you.`
  } else if (resolutionType === 'pending') {
    statusMessage = `We've notified the previous owner to confirm they sold it. This is just a formality - you have full access now!`
  } else {
    statusMessage = `The previous owner confirmed they sold this vehicle. Ownership has been transferred to you.`
  }
  
  return {
    subject: `Welcome! Your ${vehicle.displayName} is ready`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">🎉 Vehicle Added Successfully!</h2>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          ${greeting},
        </p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Your <strong>${vehicle.displayName}</strong> is now in your MotoMind garage!
        </p>
        
        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #1e40af;">
            ${statusMessage}
          </p>
        </div>
        
        <h3 style="color: #1f2937; margin-top: 32px;">What's Next?</h3>
        
        <ul style="color: #374151; line-height: 1.8;">
          <li>📍 <strong>Track your trips</strong> - Automatic GPS tracking</li>
          <li>🔧 <strong>Log maintenance</strong> - Never miss an oil change</li>
          <li>💰 <strong>Track expenses</strong> - See your total cost of ownership</li>
          <li>🤖 <strong>Get AI insights</strong> - Smart recommendations</li>
        </ul>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0;">
          Open Your Garage
        </a>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="font-size: 12px; color: #9ca3af;">
          MotoMind • Your AI Vehicle Assistant
        </p>
      </div>
    `,
    text: `
${greeting},

Your ${vehicle.displayName} is now in your MotoMind garage!

${statusMessage}

What's Next?
• Track your trips - Automatic GPS tracking
• Log maintenance - Never miss an oil change
• Track expenses - See your total cost of ownership
• Get AI insights - Smart recommendations

Open your garage: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

- MotoMind Team
    `
  }
}
