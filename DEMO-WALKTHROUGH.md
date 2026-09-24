# Client walkthrough

All accounts use `Password123!`. Data is saved in this browser; different devices do not share it.

1. Sign in as `admin@democrm.com`. Add a buyer in Lead Database, then open their record.
2. Use Assign / hand over to assign Vikram (Telecaller).
3. Switch role; sign in as `tele@democrm.com`. Open the assigned buyer. Record call feedback and Visit declined with remarks and a follow-up date. Complete the follow-up; record Visit agreed and schedule the visit.
4. Switch to admin or `manager@democrm.com`. Open that same buyer and assign Amit (Sales_Exec).
5. Sign in as `sales1@democrm.com`. Open the buyer. In Customer journey, record visit feedback and Complete visit.
6. Open negotiation, enter the unit, quoted amount, and customer offer. Confirm the final booking amount in Customer journey.
7. Return as admin. The same lead now shows the complete timeline, owner, booked amount, and stage. Dashboard and reports include the booking revenue.

Admins and managers see all leads. Sales agents and telecallers see their assigned leads. Only admins create users; admins/managers assign leads and change workspace settings. Sales agents/managers complete visits and close deals. A reassigned lead disappears from its former owner's list.

This is a browser demo of permissions, not server security. Contact links can open the phone/WhatsApp apps; the demo itself does not send messages.

Verification: `node tests/workflow.mjs`, then `npm run build`.
