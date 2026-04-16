# ROTD WhatsApp Sequences
All messages: British English. Conversational but authoritative. Short. No emoji unless noted.
Configure in GHL: Conversations > WhatsApp > Automation

---

## SEQUENCE 1 - TRIAL ONBOARDING
**Trigger:** Trial subscription confirmed
**Channel:** WhatsApp

---

**Message 1 - Immediate (on signup)**

Race Of The Day - your trial is live.

Selections arrive by 9:30am every racing day. Two to seven, depending on the card. If nothing is worth sending, nothing gets sent.

The full results record is on the site - worth looking at before your first selections arrive.

Reply HELP at any time if you have a question.

---

**Message 2 - Day 1 morning (before 9:30am)**

Good morning. Today's selections are on their way to your inbox now.

If you do not see them within the hour, check your spam folder and reply here - we will sort it.

---

**Message 3 - Day 3**

Three days in.

A reminder that the results record on the site shows the full twelve months - not just the headline figures. The flat weeks are in there alongside the good months. That transparency is the point.

If you have questions about how the selections work or what the methodology looks at, reply here.

---

**Message 4 - Day 5 (upgrade prompt)**

Your trial ends in two days.

Founding member pricing is still available - £19/month, locked for life. First 50 spots only. When those fill, the price moves to £29.

To continue: [SUBSCRIPTION LINK]

No pressure if it is not right for you.

---

**Message 5 - Day 7 (trial end day)**

Your trial ends today.

If you want to carry on, founding membership is £19/month - locked for life while spots remain.

[SUBSCRIPTION LINK]

If you have any questions before deciding, reply here.

---

## SEQUENCE 2 - ACTIVE MEMBER DAILY TIP NOTIFICATION
**Trigger:** Daily tip email sent (racing days only)
**Channel:** WhatsApp
**Note:** Optional - only enable if member opts in to WhatsApp delivery

---

**Daily message (racing days, 9:30am)**

Today's selections are in your inbox. [X] tips for [Day].

Running P&L: [+/- X pts]

[VIEW RECORD: link]

---

**No-send day message (optional - racing days with no selections)**

No selections today. The card did not present the right conditions.

This is the system working as intended.

---

## SEQUENCE 3 - TRIAL EXPIRED / RE-ENGAGEMENT
**Trigger:** Trial ends with no conversion, 48 hours after
**Channel:** WhatsApp

---

**Message 1 - 48 hours post-expiry**

Your Race Of The Day trial ended two days ago.

If you are still thinking about it, founding membership is £19/month - locked for life, cancel anytime.

[SUBSCRIPTION LINK]

If it was not right for you, no problem. This is the last message we will send.

---

## SEQUENCE 4 - PAYMENT FAILED
**Trigger:** Payment failure
**Channel:** WhatsApp

---

**Message 1 - Immediate**

Race Of The Day - we could not process your last payment.

Your access has not stopped yet. Update your card details here and we will retry automatically:

[BILLING LINK]

Reply if you need help.

---

**Message 2 - 24 hours later (if not resolved)**

Your payment is still showing as failed.

Access will stop at the end of your current period if this is not resolved.

[BILLING LINK]

Reply here if you would rather cancel - no awkward process.

---

## SEQUENCE 5 - FOUNDING MEMBER TIER CHANGE ALERT
**Trigger:** Manual send when a pricing tier fills
**Channel:** WhatsApp (broadcast to unconverted trial list)

---

**Tier change message**

Race Of The Day - founding pricing update.

The £19/month founding tier is now full. Membership is now £29/month.

If you have been considering joining, this is the current rate:

[SUBSCRIPTION LINK]

The next tier closes at 100 members.

---

## GHL IMPLEMENTATION NOTES

**Setup:**
- WhatsApp Business account required (via GHL LC Phone or Twilio connector)
- All sequences built as GHL Workflows triggered by contact tags or pipeline stage changes
- Daily tip notification (Sequence 2): webhook from tip input system triggers GHL workflow, which sends WhatsApp to opted-in members only
- Opt-in: add WhatsApp opt-in checkbox to checkout flow and trial signup form

**Message timing:**
- Morning messages: 8:30-9:30am only. Never send before 8am or after 8pm.
- Re-engagement messages: one send only, no follow-up sequences after final message

**Personalisation tokens (GHL):**
- {{contact.first_name}} - use sparingly, only in first message of onboarding
- {{custom_values.current_pl}} - running P&L from Google Sheets webhook
- {{custom_values.todays_selections}} - tip count from daily webhook

**Compliance:**
- Every sequence must include opt-out instruction in first message (Reply STOP to unsubscribe)
- GHL handles STOP/HELP keywords automatically via LC Phone
- Do not send marketing messages on non-racing days
