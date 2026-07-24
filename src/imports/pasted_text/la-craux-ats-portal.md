Role & Goal:
Act as a Principal Product Designer & UI/UX Design System Lead. Create a production-ready, highly polished, Apple-inspired Recruitment Management System (ATS) and Applicant Portal named "La Craux Job Application Portal". The aesthetic must feel modern, premium, minimal, clean, accessible (WCAG AAA), and structured like leading enterprise HR tools (Greenhouse, Lever, Workday).

Design Aesthetics & Visual Tokens:
• Visual Style: Apple-inspired minimalist UI, subtle borders (1px stroke with light opacity), smooth rounded corners (8px–12px for cards, 6px for inputs, 999px for pills/badges), micro-shadows, generous white space, clear layout hierarchy.
• Color Palette:
  - Backgrounds: Neutral Light Canvas (#F9FAFB or #FFFFFF)
  - Primary Accent: Deep Slate Blue / Indigo (#1E293B / #4F46E5)
  - Secondary / Neutral Text: Charcoal (#0F172A), Muted Text (#64748B)
  - Interactive / Highlight: Royal Violet (#6366F1)
  - Borders: Neutral Light Gray (#E2E8F0)
  - Success/Warning/Info Badges: Subtle pastel backgrounds with strong contrast text.
• Typography: Modern Sans-Serif (Inter or SF Pro Display/Text). Crisp hierarchy (H1 32px, H2 24px, H3 18px, Body 14px, Captions 12px).

Overall Structure & Key Layouts Required:

1. APPLICANT PORTAL (Candidate View - Multi-Step Wizard & Single Page Layout)
Include a top navigation bar featuring the "La Craux" brand logo, application progress indicator, and a clear step counter.
Organize all 11 content sections into distinct, beautifully structured card modules with smooth spacing:

• Section 1: Welcome & Data Privacy Notice
  - Clean card container.
  - "WELCOME!" header with welcoming copy().
  - Highlighted "Data Privacy Notice" card with privacy details (DPA 2012 / RA 10173).
  - Bulleted list of collected data fields.
  - Retention details and external link pill/button for National Privacy Commission (https://privacy.gov.ph/data-privacy-act/).
  - "APPLICANT DECLARATION" check box with explicit consent text:
    [ ] "Yes, I agree and consent to the processing of my personal data."

• Section 2: Personal Information
  - Form layout (2-column layout on Desktop, 1-column on Mobile).
  - Inputs: Full Name (with helper text), Email Address, Mobile Number (with format helper +639XXXXXXXXX), Date of Birth (DatePicker), Gender (Radio buttons or visual Segmented Control: Male, Female, Prefer not to say), City / Municipality(text field), Province(text field).
  - Multiple choice: "How did you hear about this job opening?" (Facebook, LinkedIn, Indeed, Company Website, Jobstreet, Referral, Other).
  - Dropdown: "What position you are applying for?" (Sales & Operations — Junior Manager, Marketing — Junior Manager, Entry level — Sales Associate) if Sales & Operations — Junior Manager, Marketing — Junior Manager is chosen the Question 2 would appear in section 10, the Entry Level — Sales Associate is question 1.

• Section 3: Referral Information (If referral has been choses from section 2, the rest of the choices proceed to section 4)
  - Conditional Card Module (Muted or highlighted border).
  - Inputs: Full name of referrer, Position/Department (optional).

• Section 4: Educational Background
  - Dropdown / Radio Grid: Highest Educational Attainment (Bachelor's, College Undergraduate, Associate, Senior High, High School, Other).
  - Inputs: Course/Degree (with placeholder "e.g., Bachelor of Science in Information Technology"), School/University, Campus/Branch.

• Section 5: College Undergraduate Details(if College Undergraduate is chosen from section 4, the rest of the choices proceeds to section 6)
  - Segmented options or Radio buttons for years completed: 1st Year to 5th Year+.

• Section 6: Work Experience
  - Multi-select Chip Grid / Tag Group for Industries: Cosmetics, Fragrance, FMCG, Retail, Sales, Marketing, E-commerce, Other.

• Section 7: English Proficiency Assessment
  - Instruction Step Card with visual 1-2-3-4 step badges.
  - External Link Button: British Council CEFR Test.
  - File Upload Zone: Drag & drop box for test result screenshot.

• Section 8: Job Preferences
  - Start Date options (Radio group: Immediately, Within 2 weeks, Within 1 month, Other).
  - Expected Monthly Salary input (with "PHP" prefix).
  - Work Arrangement Multi-select Checkboxes (Onsite Manila, Holidays, Weekends, Mall hours, Overtime).
  - Multi-line Text Area: "Tell us why you want to join our company."
  - Vocaroo Link Input field with icon and link format guide.

• Section 9: Resume Submission
  - Drag-and-drop file uploader block supporting .pdf, .doc, .docx with file size limit indicators and upload preview state.

• Section 10: Video Screening Assessment (1 & 2)
  - Numbered instruction list with external VEED.io button link.
  - Requirements pill box (1-3 mins, quiet area, face visible, speak clearly).
  - Highlighted Callout Box containing the specific prompt/question:
    * Question 1: "You have 3 minutes to convince a customer to buy a perfume. Your time starts now."
    * Question 2: "What is your understanding of the role, and how does your experience relate to it?"
  - Input Field: Paste VEED link (with valid URL placeholder format check).
  - Final Certification Checkbox: [ ] "Yes, I certify that all information provided is accurate."

• Action Area: Sticky bottom bar or full-width button: "Submit Application" (Primary accent CTA) + "Save Draft" (Secondary CTA).

2. ADMIN / HR RECRUITMENT DASHBOARD (Internal ATS View)
Create a modern admin candidate evaluation screen:
• Top Navigation: Search bar, Filter tags, Notification bell, HR Profile avatar.
• Left Sidebar: Pipeline stages (Applied, Screening, Video Review, Interview, Offered, Rejected).
• Main Workspace:
  - Candidate profile card for "La Craux Applicant".
  - Quick summary: Contact Info, CEFR Test Score Badge, Vocaroo Audio Player Embed UI, VEED Video Player Embed Preview.
  - Tabs: Application Details, Submitted Documents, HR Rating & Internal Notes, Audit Log.
  - Action buttons: "Advance Candidate", "Reject Candidate", "Schedule Interview".

Responsive Specs:
• Provide both Desktop (1440px wide) and Mobile (390px wide) artboards using Figma Auto Layout 5.0, variables for spacing and colors, and interactive component states (Default, Hover, Active, Disabled, Focus).