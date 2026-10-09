// Google Sheet linked from the hero button and nav bar.
// /htmlview is Google's read-only viewer: no Sheets app prompt, no sign-in button.
// Original share link: .../d/17kGXeGnr0GTzi6sqrn0X6ERpqXb_rsapuJMsRnzU3WQ/edit?usp=sharing
// Override per-environment with NEXT_PUBLIC_SHEET_URL in Vercel if needed.
export const SHEET_URL =
  process.env.NEXT_PUBLIC_SHEET_URL ??
  "https://docs.google.com/spreadsheets/d/17kGXeGnr0GTzi6sqrn0X6ERpqXb_rsapuJMsRnzU3WQ/htmlview";