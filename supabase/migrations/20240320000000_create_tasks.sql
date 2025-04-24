-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    day INTEGER NOT NULL,
    date DATE NOT NULL,
    task1 TEXT NOT NULL,
    task2 TEXT NOT NULL,
    task3 TEXT NOT NULL,
    task4 TEXT NOT NULL,
    task5 TEXT NOT NULL,
    weekly_challenge TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Week 1 tasks
INSERT INTO tasks (day, date, task1, task2, task3, task4, task5, weekly_challenge) VALUES
(1, '2025-04-20', 'Block Mon–Fri 9 am–2 pm for 25 h tennis in your calendar', 'Send confirmation texts/emails to all regular tennis clients', 'Audit your dog‑portrait shop & IG; update price for €20 profit', 'Define your "10‑clips/month" at €300; sketch landing page outline', 'Plan Google Sheet: tabs for Tennis hrs, Portrait sales, Clipping leads', 'Spend 15 min visualizing your €20 000/mo goal'),
(2, '2025-04-21', 'Send "refer‑a‑friend" mini‑flyer to 10 top tennis clients', 'Outline 10 promo‑post visuals & captions for portraits', 'Email 20 creators to pitch your clipping service', 'Build Google Sheet template with Date, Client, Status, Revenue', 'Set up IG ad campaign at €5/day targeting pet‑lovers', NULL),
(3, '2025-04-22', 'Follow up on referrals; confirm any new tennis bookings', 'Draft & schedule 3 "before & after sketch" Stories for portraits', 'Review clip‑service replies; book discovery calls', 'Finalize landing‑page copy & lead‑form', 'Prepare ad creatives for portrait campaign', NULL),
(4, '2025-04-23', 'Call 5 top tennis clients to offer small‑group session upsells', 'Launch your €5/day IG ads; monitor first‑day metrics', 'Hold 2 clipping discovery calls; send proposals', 'Update tracking sheet with new leads & statuses', 'Collect 3 past‑client testimonials for social proof', NULL),
(5, '2025-04-24', 'Confirm all 25 h tennis slots for next week', 'Respond to portrait inquiries; aim to close 2 sales', 'Send follow‑up emails to unresponsive clip leads', 'Record all bookings/sales in your spreadsheet', 'Do a 30‑min home body‑weight workout', NULL),
(6, '2025-04-25', 'Print/distribute updated tennis referral flyers at the court', 'Reach out to 5 local pet shops for cross‑promo deals', 'Refine your 3‑email drip sequence based on feedback', 'Review ad performance; tweak targeting as needed', 'Take a 10‑min midday meditation & stretch', NULL),
(7, '2025-04-26', 'Finalize Week 1 tennis bookings & prep Monday''s schedule', 'Analyze portrait‑ad ROI; save top 3 creatives for reuse', 'Onboard first clipping client; set up Calendly & Stripe', 'Do your Week 1 KPI review at 6 pm (hrs, sales, leads)', 'Rest & listen to one Charlie Morgan video', NULL);

-- Add RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks are viewable by everyone"
    ON tasks FOR SELECT
    USING (true); 